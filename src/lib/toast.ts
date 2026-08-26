export function toast(message: string, type: 'success' | 'info' | 'error' = 'info') {
  const container = document.getElementById('toast-container') || (() => {
    const el = document.createElement('div');
    el.id = 'toast-container';
    el.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2';
    document.body.appendChild(el);
    return el;
  })();

  const toastEl = document.createElement('div');
  
  let bgColor = 'bg-gray-800';
  if (type === 'success') bgColor = 'bg-emerald-600';
  if (type === 'error') bgColor = 'bg-red-600';

  toastEl.className = `${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between min-w-[300px] transition-all duration-300 transform translate-y-4 opacity-0`;
  
  toastEl.innerHTML = `
    <span class="font-medium text-sm">${message}</span>
    <button class="text-white hover:text-gray-200 ml-4">&times;</button>
  `;

  container.appendChild(toastEl);
  
  // Animate in
  requestAnimationFrame(() => {
    toastEl.classList.remove('translate-y-4', 'opacity-0');
  });

  const close = () => {
    toastEl.classList.add('opacity-0', 'translate-y-4');
    setTimeout(() => {
      if (container.contains(toastEl)) {
        container.removeChild(toastEl);
      }
    }, 300);
  };

  toastEl.querySelector('button')?.addEventListener('click', close);
  
  setTimeout(close, 3000);
}
