/**
 * @file history/_layout.tsx
 * @description Stack navigator para la sección Historial.
 *
 * Crea un stack de dos niveles dentro del tab "Historial":
 * - `index`  → lista de semanas registradas
 * - `[id]`   → pantalla de detalle de una semana concreta
 *
 * El header nativo de React Navigation está desactivado (`headerShown: false`)
 * porque cada pantalla usa su propio componente `Header` / barra de retroceso
 * para mantener consistencia visual con el resto de la app.
 */
import { Stack } from 'expo-router';

export default function HistoryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
  );
}
