const pluralUk = (n: number, one: string, few: string, many: string) => {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}

export const pluralFarm = (n: number) => pluralUk(n, 'поле', 'поля', 'полів')
export const pluralCrop = (n: number) => pluralUk(n, 'культура', 'культури', 'культур')
export const pluralFarmer = (n: number) => pluralUk(n, 'фермер', 'фермери', 'фермерів')
