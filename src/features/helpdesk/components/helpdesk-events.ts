// Sinyal untuk membuka jendela helpdesk dari bagian lain halaman
// (misalnya kartu bantuan di sidebar dashboard). Widget helpdesk
// mendengarkan sinyal ini dan membuka obrolan yang sama seperti
// tombol bulatnya.
export const HELPDESK_OPEN_EVENT = "ftm:helpdesk-open";

export function openHelpdesk() {
  window.dispatchEvent(new Event(HELPDESK_OPEN_EVENT));
}
