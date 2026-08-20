import { Platform, Share } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { buildMonthlyPdfHtml, reportFileName, type StatementsInput } from './report';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Imprime un document HTML isolé. Ne jamais appeler window.print() sur l’app. */
async function printIsolatedHtml(html: string): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Impression web indisponible');
  }

  const popup = window.open('', '_blank');
  if (popup) {
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    await wait(120);
    popup.focus();
    popup.print();
    return;
  }

  const frame = document.createElement('iframe');
  frame.title = 'Synthèse Semence';
  frame.setAttribute('aria-hidden', 'true');
  frame.style.position = 'fixed';
  frame.style.left = '-10000px';
  frame.style.top = '0';
  frame.style.width = '210mm';
  frame.style.height = '297mm';
  frame.style.border = '0';
  document.body.appendChild(frame);

  const win = frame.contentWindow;
  const doc = frame.contentDocument;
  if (!win || !doc) {
    frame.remove();
    throw new Error('Impression web indisponible');
  }

  doc.open();
  doc.write(html);
  doc.close();
  await wait(120);
  win.focus();
  win.print();
  const cleanup = () => frame.remove();
  win.addEventListener('afterprint', cleanup);
  setTimeout(cleanup, 60000);
}

/** Crée le PDF de synthèse du cycle. Sur le web, imprime ce document, pas l’écran. */
export async function shareMonthlyPdf(input: StatementsInput): Promise<void> {
  const html = buildMonthlyPdfHtml(input);
  const title = reportFileName(input.cycle.key, 'pdf');

  if (Platform.OS === 'web') {
    await printIsolatedHtml(html);
    return;
  }

  const file = await Print.printToFileAsync({
    html,
    width: 595,
    height: 842,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
      dialogTitle: title,
    });
    return;
  }

  await Share.share({ url: file.uri, title });
}
