// Знак АгроПростору для HTML поза Vue (друк, експорт): ті самі фігури, що й UiAppLogo
export function brandMarkSvg(size = 22, tone: 'light' | 'dark' = 'light', cut = '#FFFFFF') {
  const c = tone === 'dark'
    ? { main: '#FAF6EC', leaf: '#A8CC84', fruit: '#E8835F' }
    : { main: '#2F5233', leaf: '#7FA35B', fruit: '#C2563A' }
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;flex:none">`
    + `<rect x="2.8" y="2.8" width="8.2" height="8.2" rx="2.4" fill="${c.main}"/>`
    + `<path d="M13 11c0-5 3.1-8.2 8.2-8.2 0 5.1-3.2 8.2-8.2 8.2z" fill="${c.leaf}"/>`
    + `<path d="M13.3 10.7l4.6-4.6" stroke="${cut}" stroke-width="1.1" stroke-linecap="round"/>`
    + `<circle cx="6.9" cy="17.1" r="4.2" fill="${c.fruit}"/>`
    + `<rect x="13.9" y="13.9" width="6.4" height="6.4" rx="1.9" stroke="${c.main}" stroke-width="1.8"/></svg>`
}

// Рядок «знак + АгроПростір» у шапці друкованого документа
export function printBrand() {
  return `<div style="display:flex;align-items:center;gap:8px;margin:0 0 14px">${brandMarkSvg(22)}`
    + `<span style="font:700 15px Georgia,'Times New Roman',serif;color:#2F5233">АгроПростір</span></div>`
}
