import { Platform, Share } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { Settings, Transaction } from '../types';
import { buildMonthlyPdfHtml, reportFileName } from './report';

/** Crée le PDF du mois et l’ouvre dans le partage système. Sur le web, la boîte d’impression. */
export async function shareMonthlyPdf(input: {
  settings: Settings;
  transactions: Transaction[];
  year: number;
  month: number;
}): Promise<void> {
  const html = buildMonthlyPdfHtml(input);
  const title = reportFileName(input.year, input.month, 'pdf');

  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
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
