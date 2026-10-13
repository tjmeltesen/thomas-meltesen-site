const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const fmtYm = (ym: string) => { const [y, m] = ym.split('-'); return `${M[Number(m) - 1]} ${y}`; };
