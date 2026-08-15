<#
  Génère les visuels de marque Semence à partir du logo source (fond crème).
  Détoure le fond, isole le monogramme, puis écrit les fichiers utilisés par
  l'application et par app.json.

  Usage : powershell -ExecutionPolicy Bypass -File scripts/make-brand-assets.ps1 -Source chemin/vers/logo.png
#>
param(
  [Parameter(Mandatory = $true)][string]$Source,
  [string]$OutDir = '',
  [string]$PreviewDir = ''
)

if (-not $OutDir) {
  $root = Split-Path -Parent $MyInvocation.MyCommand.Path
  $OutDir = Join-Path $root '..\assets'
}

Add-Type -AssemblyName System.Drawing

$code = @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Text;

public static class BrandTool
{
    const double T0 = 16, T1 = 48;
    const double Core = 62;
    const double Feather = 3;
    const int Cell = 96;
    static readonly Color Cream = Color.FromArgb(255, 245, 242, 236);
    static readonly Color Ink = Color.FromArgb(255, 198, 158, 92);

    /// <summary>
    /// Le fond crème est texturé et vignetté : on l'estime localement en prenant
    /// le pixel le plus clair d'une large fenêtre, puis on interpole.
    /// </summary>
    static double[][][] EstimateBackground(byte[] buf, int stride, int w, int h)
    {
        int gw = w / Cell + 2, gh = h / Cell + 2;
        double[][][] grid = new double[gh][][];
        for (int gy = 0; gy < gh; gy++)
        {
            grid[gy] = new double[gw][];
            for (int gx = 0; gx < gw; gx++)
            {
                int cx = gx * Cell, cy = gy * Cell;
                int x0 = Math.Max(0, cx - Cell), x1 = Math.Min(w - 1, cx + Cell);
                int y0 = Math.Max(0, cy - Cell), y1 = Math.Min(h - 1, cy + Cell);
                double br = 0, bg = 0, bb = 0, best = -1;
                for (int y = y0; y <= y1; y += 2)
                {
                    int row = y * stride;
                    for (int x = x0; x <= x1; x += 2)
                    {
                        int i = row + x * 4;
                        double lum = 0.299 * buf[i + 2] + 0.587 * buf[i + 1] + 0.114 * buf[i];
                        if (lum > best) { best = lum; br = buf[i + 2]; bg = buf[i + 1]; bb = buf[i]; }
                    }
                }
                grid[gy][gx] = new double[] { br, bg, bb };
            }
        }
        return grid;
    }

    static double SampleBg(double[][][] grid, int gw, int gh, int x, int y, int channel)
    {
        double u = (double)x / Cell, v = (double)y / Cell;
        int x0 = (int)Math.Floor(u), y0 = (int)Math.Floor(v);
        int x1 = Math.Min(gw - 1, x0 + 1), y1 = Math.Min(gh - 1, y0 + 1);
        x0 = Math.Min(x0, gw - 1); y0 = Math.Min(y0, gh - 1);
        double fx = u - x0, fy = v - y0;
        double a = grid[y0][x0][channel] * (1 - fx) + grid[y0][x1][channel] * fx;
        double b = grid[y1][x0][channel] * (1 - fx) + grid[y1][x1][channel] * fx;
        return a * (1 - fy) + b * fy;
    }

    static Bitmap Cutout(string path)
    {
        using (Bitmap src = new Bitmap(path))
        {
            int w = src.Width, h = src.Height;
            Bitmap outBmp = new Bitmap(w, h, PixelFormat.Format32bppArgb);
            BitmapData sd = src.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            BitmapData od = outBmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.WriteOnly, PixelFormat.Format32bppArgb);
            int len = sd.Stride * h;
            byte[] sbuf = new byte[len];
            byte[] obuf = new byte[len];
            Marshal.Copy(sd.Scan0, sbuf, 0, len);

            int gw = w / Cell + 2, gh = h / Cell + 2;
            double[][][] grid = EstimateBackground(sbuf, sd.Stride, w, h);

            double[] dist = new double[w * h];
            for (int y = 0; y < h; y++)
            {
                int row = y * sd.Stride;
                for (int x = 0; x < w; x++)
                {
                    int i = row + x * 4;
                    double b = sbuf[i], g = sbuf[i + 1], r = sbuf[i + 2];
                    double nr = SampleBg(grid, gw, gh, x, y, 0);
                    double ng = SampleBg(grid, gw, gh, x, y, 1);
                    double nb = SampleBg(grid, gw, gh, x, y, 2);
                    dist[y * w + x] = Math.Sqrt((r - nr) * (r - nr) + (g - ng) * (g - ng) + (b - nb) * (b - nb));
                }
            }

            // Le fond marbré crée un halo diffus : on ne garde que ce qui touche
            // vraiment le tracé, mesuré par distance au noyau franchement doré.
            double[] toCore = DistanceToCore(dist, w, h, Core);

            for (int y = 0; y < h; y++)
            {
                int row = y * sd.Stride;
                for (int x = 0; x < w; x++)
                {
                    int i = row + x * 4;
                    double b = sbuf[i], g = sbuf[i + 1], r = sbuf[i + 2];
                    double nr = SampleBg(grid, gw, gh, x, y, 0);
                    double ng = SampleBg(grid, gw, gh, x, y, 1);
                    double nb = SampleBg(grid, gw, gh, x, y, 2);
                    double d = dist[y * w + x];
                    double a = (d - T0) / (T1 - T0);
                    double reach = toCore[y * w + x];
                    double keep = reach <= Feather ? 1 : (reach >= Feather + 3 ? 0 : (Feather + 3 - reach) / 3.0);
                    a *= keep;
                    if (a <= 0)
                    {
                        obuf[i] = (byte)Ink.B; obuf[i + 1] = (byte)Ink.G; obuf[i + 2] = (byte)Ink.R; obuf[i + 3] = 0;
                        continue;
                    }
                    if (a > 1) a = 1;
                    // Retire la teinte crème résiduelle des bords adoucis.
                    double ur = (r - (1 - a) * nr) / a;
                    double ug = (g - (1 - a) * ng) / a;
                    double ub = (b - (1 - a) * nb) / a;
                    obuf[i] = Clamp(ub); obuf[i + 1] = Clamp(ug); obuf[i + 2] = Clamp(ur);
                    obuf[i + 3] = (byte)Math.Round(a * 255);
                }
            }

            Marshal.Copy(obuf, 0, od.Scan0, len);
            src.UnlockBits(sd);
            outBmp.UnlockBits(od);
            return outBmp;
        }
    }

    /// <summary>Chanfrein deux passes : distance de chaque pixel au tracé franc.</summary>
    static double[] DistanceToCore(double[] dist, int w, int h, double core)
    {
        double big = 1e6;
        double[] out_ = new double[w * h];
        for (int i = 0; i < out_.Length; i++) out_[i] = dist[i] >= core ? 0 : big;

        for (int y = 0; y < h; y++)
        {
            for (int x = 0; x < w; x++)
            {
                int i = y * w + x;
                if (out_[i] == 0) continue;
                double best = out_[i];
                if (x > 0) best = Math.Min(best, out_[i - 1] + 1);
                if (y > 0) best = Math.Min(best, out_[i - w] + 1);
                if (x > 0 && y > 0) best = Math.Min(best, out_[i - w - 1] + 1.414);
                if (x < w - 1 && y > 0) best = Math.Min(best, out_[i - w + 1] + 1.414);
                out_[i] = best;
            }
        }
        for (int y = h - 1; y >= 0; y--)
        {
            for (int x = w - 1; x >= 0; x--)
            {
                int i = y * w + x;
                double best = out_[i];
                if (x < w - 1) best = Math.Min(best, out_[i + 1] + 1);
                if (y < h - 1) best = Math.Min(best, out_[i + w] + 1);
                if (x < w - 1 && y < h - 1) best = Math.Min(best, out_[i + w + 1] + 1.414);
                if (x > 0 && y < h - 1) best = Math.Min(best, out_[i + w - 1] + 1.414);
                out_[i] = best;
            }
        }
        return out_;
    }

    static byte Clamp(double v)
    {
        if (v < 0) return 0;
        if (v > 255) return 255;
        return (byte)Math.Round(v);
    }

    static double[] RowInk(Bitmap bmp)
    {
        int w = bmp.Width, h = bmp.Height;
        double[] rows = new double[h];
        BitmapData d = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        int len = d.Stride * h;
        byte[] buf = new byte[len];
        Marshal.Copy(d.Scan0, buf, 0, len);
        bmp.UnlockBits(d);
        for (int y = 0; y < h; y++)
        {
            double sum = 0;
            int row = y * d.Stride;
            for (int x = 0; x < w; x++) sum += buf[row + x * 4 + 3];
            rows[y] = sum / 255.0;
        }
        return rows;
    }

    /// <summary>
    /// Isole le monogramme : plus gros tracé continu, plus les petits éléments
    /// centrés qu'il enferme (l'étoile), sans le mot ni les arcs décoratifs.
    /// </summary>
    static Rectangle IsolateMark(Bitmap bmp)
    {
        int w = bmp.Width, h = bmp.Height;
        BitmapData d = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        int len = d.Stride * h;
        byte[] buf = new byte[len];
        Marshal.Copy(d.Scan0, buf, 0, len);

        int[] label = new int[w * h];
        for (int i = 0; i < label.Length; i++) label[i] = -1;
        int[] stack = new int[w * h];
        var boxes = new System.Collections.Generic.List<Rectangle>();
        var areas = new System.Collections.Generic.List<int>();

        for (int start = 0; start < label.Length; start++)
        {
            int sx = start % w, sy = start / w;
            if (buf[sy * d.Stride + sx * 4 + 3] < 32 || label[start] >= 0) continue;
            int id = boxes.Count;
            int top = 0;
            stack[top++] = start;
            label[start] = id;
            int area = 0, minX = w, maxX = -1, minY = h, maxY = -1;

            while (top > 0)
            {
                int p = stack[--top];
                int px = p % w, py = p / w;
                area++;
                if (px < minX) minX = px;
                if (px > maxX) maxX = px;
                if (py < minY) minY = py;
                if (py > maxY) maxY = py;

                for (int dy = -1; dy <= 1; dy++)
                {
                    int ny = py + dy;
                    if (ny < 0 || ny >= h) continue;
                    for (int dx = -1; dx <= 1; dx++)
                    {
                        int nx = px + dx;
                        if (nx < 0 || nx >= w) continue;
                        int q = ny * w + nx;
                        if (label[q] >= 0 || buf[ny * d.Stride + nx * 4 + 3] < 32) continue;
                        label[q] = id;
                        stack[top++] = q;
                    }
                }
            }
            boxes.Add(new Rectangle(minX, minY, maxX - minX + 1, maxY - minY + 1));
            areas.Add(area);
        }

        int main = 0;
        for (int i = 1; i < areas.Count; i++) if (areas[i] > areas[main]) main = i;
        Rectangle mainBox = boxes[main];
        double midLeft = mainBox.Left + mainBox.Width * 0.25;
        double midRight = mainBox.Right - mainBox.Width * 0.25;

        bool[] keep = new bool[boxes.Count];
        for (int i = 0; i < boxes.Count; i++)
        {
            if (i == main) { keep[i] = true; continue; }
            Rectangle b = boxes[i];
            double cx = b.Left + b.Width / 2.0;
            keep[i] = mainBox.Contains(b) && cx > midLeft && cx < midRight;
        }

        // Efface les tracés écartés et leur frange adoucie.
        bool[] kill = new bool[w * h];
        for (int i = 0; i < label.Length; i++)
            if (label[i] >= 0 && !keep[label[i]]) kill[i] = true;
        for (int pass = 0; pass < 3; pass++)
        {
            bool[] grown = (bool[])kill.Clone();
            for (int y = 0; y < h; y++)
                for (int x = 0; x < w; x++)
                {
                    if (!kill[y * w + x]) continue;
                    for (int dy = -1; dy <= 1; dy++)
                        for (int dx = -1; dx <= 1; dx++)
                        {
                            int nx = x + dx, ny = y + dy;
                            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                            if (label[ny * w + nx] < 0) grown[ny * w + nx] = true;
                        }
                }
            kill = grown;
        }
        for (int y = 0; y < h; y++)
            for (int x = 0; x < w; x++)
                if (kill[y * w + x]) buf[y * d.Stride + x * 4 + 3] = 0;

        Marshal.Copy(buf, 0, d.Scan0, len);
        bmp.UnlockBits(d);
        return mainBox;
    }

    static Rectangle LargestShapeBounds(Bitmap bmp)
    {
        int w = bmp.Width, h = bmp.Height;
        BitmapData d = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        int len = d.Stride * h;
        byte[] buf = new byte[len];
        Marshal.Copy(d.Scan0, buf, 0, len);
        bmp.UnlockBits(d);

        bool[] ink = new bool[w * h];
        for (int y = 0; y < h; y++)
            for (int x = 0; x < w; x++)
                ink[y * w + x] = buf[y * d.Stride + x * 4 + 3] >= 32;

        bool[] seen = new bool[w * h];
        int[] stack = new int[w * h];
        Rectangle best = Rectangle.Empty;
        int bestArea = 0;

        for (int start = 0; start < ink.Length; start++)
        {
            if (!ink[start] || seen[start]) continue;
            int top = 0;
            stack[top++] = start;
            seen[start] = true;
            int area = 0, minX = w, maxX = -1, minY = h, maxY = -1;

            while (top > 0)
            {
                int p = stack[--top];
                int px = p % w, py = p / w;
                area++;
                if (px < minX) minX = px;
                if (px > maxX) maxX = px;
                if (py < minY) minY = py;
                if (py > maxY) maxY = py;

                for (int dy = -1; dy <= 1; dy++)
                {
                    int ny = py + dy;
                    if (ny < 0 || ny >= h) continue;
                    for (int dx = -1; dx <= 1; dx++)
                    {
                        int nx = px + dx;
                        if (nx < 0 || nx >= w) continue;
                        int q = ny * w + nx;
                        if (!ink[q] || seen[q]) continue;
                        seen[q] = true;
                        stack[top++] = q;
                    }
                }
            }

            if (area > bestArea)
            {
                bestArea = area;
                best = new Rectangle(minX, minY, maxX - minX + 1, maxY - minY + 1);
            }
        }
        return best;
    }

    static Rectangle Bounds(Bitmap bmp, int fromY, int toY)
    {
        int w = bmp.Width, h = bmp.Height;
        BitmapData d = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        int len = d.Stride * h;
        byte[] buf = new byte[len];
        Marshal.Copy(d.Scan0, buf, 0, len);
        bmp.UnlockBits(d);
        int minX = w, maxX = -1, minY = h, maxY = -1;
        for (int y = fromY; y <= toY && y < h; y++)
        {
            int row = y * d.Stride;
            for (int x = 0; x < w; x++)
            {
                if (buf[row + x * 4 + 3] < 24) continue;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
        if (maxX < 0) return Rectangle.Empty;
        return new Rectangle(minX, minY, maxX - minX + 1, maxY - minY + 1);
    }

    static Bitmap Crop(Bitmap src, Rectangle r, int pad)
    {
        Rectangle box = Rectangle.Inflate(r, pad, pad);
        box.Intersect(new Rectangle(0, 0, src.Width, src.Height));
        Bitmap outBmp = new Bitmap(box.Width, box.Height, PixelFormat.Format32bppArgb);
        using (Graphics g = Graphics.FromImage(outBmp))
        {
            g.Clear(Color.Transparent);
            g.CompositingMode = CompositingMode.SourceCopy;
            g.DrawImage(src, new Rectangle(0, 0, box.Width, box.Height), box, GraphicsUnit.Pixel);
        }
        return outBmp;
    }

    static Bitmap Canvas(Bitmap mark, int size, double fill, Color? background)
    {
        Bitmap outBmp = new Bitmap(size, size, PixelFormat.Format32bppArgb);
        using (Graphics g = Graphics.FromImage(outBmp))
        {
            g.Clear(background.HasValue ? background.Value : Color.Transparent);
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.CompositingQuality = CompositingQuality.HighQuality;
            double box = size * fill;
            double scale = Math.Min(box / mark.Width, box / mark.Height);
            int dw = (int)Math.Round(mark.Width * scale);
            int dh = (int)Math.Round(mark.Height * scale);
            g.DrawImage(mark, (size - dw) / 2, (size - dh) / 2, dw, dh);
        }
        return outBmp;
    }

    public static string Run(string source, string outDir, string previewDir)
    {
        StringBuilder log = new StringBuilder();
        using (Bitmap full = Cutout(source))
        {
            Rectangle fullBox = Bounds(full, 0, full.Height - 1);
            Bitmap solo = full.Clone(new Rectangle(0, 0, full.Width, full.Height), PixelFormat.Format32bppArgb);
            Rectangle markBox = IsolateMark(solo);
            log.AppendLine("mark=" + markBox + " lockup=" + fullBox);

            using (solo)
            using (Bitmap mark = Crop(solo, markBox, 6))
            using (Bitmap lockup = Crop(full, fullBox, 10))
            {
                mark.Save(System.IO.Path.Combine(outDir, "brand", "semence-monogramme-or.png"), ImageFormat.Png);
                lockup.Save(System.IO.Path.Combine(outDir, "brand", "semence-logo-or.png"), ImageFormat.Png);

                using (Bitmap icon = Canvas(mark, 1024, 0.62, Cream))
                {
                    icon.Save(System.IO.Path.Combine(outDir, "brand", "marque-semence-or.png"), ImageFormat.Png);
                    icon.Save(System.IO.Path.Combine(outDir, "icon.png"), ImageFormat.Png);
                    icon.Save(System.IO.Path.Combine(outDir, "splash-icon.png"), ImageFormat.Png);
                    icon.Save(System.IO.Path.Combine(outDir, "favicon.png"), ImageFormat.Png);
                }

                using (Bitmap fg = Canvas(mark, 1024, 0.46, null))
                {
                    fg.Save(System.IO.Path.Combine(outDir, "android-icon-foreground.png"), ImageFormat.Png);
                }

                using (Bitmap mono = Canvas(mark, 1024, 0.46, null))
                {
                    Tint(mono, Color.FromArgb(255, 0, 0, 0));
                    mono.Save(System.IO.Path.Combine(outDir, "android-icon-monochrome.png"), ImageFormat.Png);
                }

                if (!string.IsNullOrEmpty(previewDir))
                {
                    using (Bitmap dark = Canvas(mark, 420, 0.72, Color.FromArgb(255, 22, 53, 41)))
                        dark.Save(System.IO.Path.Combine(previewDir, "preview-dark.png"), ImageFormat.Png);
                    using (Bitmap light = Canvas(mark, 420, 0.72, Color.FromArgb(255, 241, 238, 230)))
                        light.Save(System.IO.Path.Combine(previewDir, "preview-light.png"), ImageFormat.Png);
                }

                log.AppendLine("monogramme " + mark.Width + "x" + mark.Height + ", lockup " + lockup.Width + "x" + lockup.Height);
            }
        }
        return log.ToString();
    }

    static void Tint(Bitmap bmp, Color color)
    {
        BitmapData d = bmp.LockBits(new Rectangle(0, 0, bmp.Width, bmp.Height), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        int len = d.Stride * bmp.Height;
        byte[] buf = new byte[len];
        Marshal.Copy(d.Scan0, buf, 0, len);
        for (int i = 0; i < len; i += 4)
        {
            buf[i] = color.B; buf[i + 1] = color.G; buf[i + 2] = color.R;
        }
        Marshal.Copy(buf, 0, d.Scan0, len);
        bmp.UnlockBits(d);
    }
}
'@

Add-Type -TypeDefinition $code -ReferencedAssemblies System.Drawing

$OutDir = (Resolve-Path $OutDir).Path
New-Item -ItemType Directory -Force -Path (Join-Path $OutDir 'brand') | Out-Null
if ($PreviewDir -and -not (Test-Path $PreviewDir)) { New-Item -ItemType Directory -Force -Path $PreviewDir | Out-Null }

$log = [BrandTool]::Run((Resolve-Path $Source).Path, $OutDir, $PreviewDir)
Write-Output $log
