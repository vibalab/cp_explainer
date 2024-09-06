import React from "react";

// HSL -> RGB 변환 함수
const hslToRgb = (h: number, s: number, l: number) => {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  return [
    Math.round(f(0) * 255),
    Math.round(f(8) * 255),
    Math.round(f(4) * 255),
  ];
};

// RGB -> HEX 변환 함수
const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;

// HSL 색상 값 생성 후 HEX 변환
const getHSLColor = (value: number): string => {
  const BASE_HUE = 197;
  const BASE_SATURATION = 71;
  const BASE_LIGHTNESS = 73;
  const lightness = 100 - (100 - BASE_LIGHTNESS) * value;

  const rgb = hslToRgb(BASE_HUE, BASE_SATURATION, lightness);
  return rgbToHex(rgb[0], rgb[1], rgb[2]);
};

type CorePeripheryTableProps = {
  p00: number;
  p01: number;
  p11: number;
};

const CorePeripheryTable: React.FC<CorePeripheryTableProps> = ({
  p00,
  p01,
  p11,
}) => {
  const p00_color = getHSLColor(p00);
  const p01_color = getHSLColor(p01);
  const p11_color = getHSLColor(p11);

  return (
    <table
      style={{
        borderCollapse: "collapse",
        marginTop: "10px",
        width: "300px",
        height: "200px",
      }}
    >
      <thead>
        <tr>
          <th></th>
          <th style={{ fontSize: "10px", width: "140px" }}>Core</th>
          <th style={{ fontSize: "10px", width: "140px" }}>Periphery</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th style={{ fontSize: "10px", width: "50px", height: "50px" }}>
            Core
          </th>
          <td
            style={{
              border: "1px solid gray",
              padding: "5px",
              backgroundColor: p11_color,
              textAlign: "center",
              verticalAlign: "middle",
              width: "50px",
              height: "50px",
            }}
          >
            {p11.toFixed(2)}
          </td>
          <td
            style={{
              border: "1px solid gray",
              padding: "5px",
              backgroundColor: p01_color,
              textAlign: "center",
              verticalAlign: "middle",
              width: "50px",
              height: "50px",
            }}
          >
            {p01.toFixed(2)}
          </td>
        </tr>
        <tr>
          <th style={{ fontSize: "10px", width: "50px", height: "50px" }}>
            Periphery
          </th>
          <td
            style={{
              border: "1px solid gray",
              padding: "5px",
              backgroundColor: p01_color,
              textAlign: "center",
              verticalAlign: "middle",
              width: "50px",
              height: "50px",
            }}
          >
            {p01.toFixed(2)}
          </td>
          <td
            style={{
              border: "1px solid gray",
              padding: "5px",
              backgroundColor: p00_color,
              textAlign: "center",
              verticalAlign: "middle",
              width: "50px",
              height: "50px",
            }}
          >
            {p00.toFixed(2)}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

export default CorePeripheryTable;
