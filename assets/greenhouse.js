(() => {
  const body = document.body;
  if (!body || body.dataset.atmosphere !== 'auto') return;

  const hour = new Date().getHours();

  body.dataset.atmosphere =
    hour >= 6 && hour < 17 ? 'day' :
    hour >= 17 && hour < 20 ? 'cloudy' :
    'evening';
})();
