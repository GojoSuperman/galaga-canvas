/**
 * 픽셀맵(문자열 배열 + 팔레트)을 파싱한다.
 * rows: ['..R..', '.RWR.'] 형태. palette: { R: '#e33', '.': null } — null은 투명.
 * 반환: { width, height, pixels: [{ x, y, color }] }
 */
export function parsePixelMap(rows, palette) {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const pixels = [];

  rows.forEach((row, y) => {
    if (row.length !== width) {
      throw new Error(`픽셀맵의 행 길이가 일정하지 않습니다 (행 ${y}: ${row.length}, 기대: ${width})`);
    }
    [...row].forEach((char, x) => {
      if (!(char in palette)) {
        throw new Error(`팔레트에 없는 문자입니다: '${char}' (행 ${y}, 열 ${x})`);
      }
      const color = palette[char];
      if (color === null) return; // 투명
      pixels.push({ x, y, color });
    });
  });

  return { width, height, pixels };
}
