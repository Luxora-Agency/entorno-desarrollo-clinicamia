// Crea un Date local para evitar desfase de UTC
function parseLocalTimeToDate(timeStr) {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(hours, minutes, seconds || 0, 0);
  return d;
}

module.exports = {
  parseLocalTimeToDate
};