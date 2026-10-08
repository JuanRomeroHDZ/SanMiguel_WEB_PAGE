/**
 * schedule.js - Control de horario de apertura de la tienda
 * Horario: Lunes a Domingo de 7:00 AM a 9:00 PM (Zona horaria: America/Tijuana)
 */

export function initSchedule() {
    const statusBadge = document.getElementById('statusBadge');
    const statusText = document.getElementById('statusText');

    if (!statusBadge || !statusText) return;

    const updateStoreStatus = () => {
        try {
            // Evaluamos la hora en la zona de Tijuana sin depender de la hora local del dispositivo del usuario
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: 'America/Tijuana',
                hour: 'numeric',
                minute: 'numeric',
                hour12: false
            });

            const parts = formatter.formatToParts(new Date());
            const hour = parseInt(parts.find(p => p.type === 'hour')?.value, 10);
            const minute = parseInt(parts.find(p => p.type === 'minute')?.value, 10);
            const currentMinsInTijuana = (hour * 60) + minute;

            // 7:00 AM = 420 minutos, 9:00 PM = 1260 minutos
            const isOpen = currentMinsInTijuana >= 420 && currentMinsInTijuana < 1260;

            statusBadge.classList.toggle('closed', !isOpen);
            statusText.textContent = isOpen ? 'Abierto hoy' : 'Cerrado ahora · Abrimos 7:00 AM';
        } catch (_) {
            // Fallback en caso de que Intl falle
            statusBadge.classList.remove('closed');
            statusText.textContent = 'Abierto hoy';
        }
    };

    updateStoreStatus();
    setInterval(updateStoreStatus, 60000);
}
