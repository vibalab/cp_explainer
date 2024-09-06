import React, { useState } from "react";

// #87CEEB의 Hue 값은 197도
const BASE_HUE = 197;
const BASE_SATURATION = 71; // 기본 채도 71%
const BASE_LIGHTNESS = 73; // 기본 명도 73%

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
  // value가 1일 때는 원래 명도, 0일 때는 Lightness 100% (흰색)
  const lightness = 100 - (100 - BASE_LIGHTNESS) * value; // value가 0이면 100%, 1이면 73%

  const rgb = hslToRgb(BASE_HUE, BASE_SATURATION, lightness);
  return rgbToHex(rgb[0], rgb[1], rgb[2]);
};

const ColorGradient: React.FC = () => {
  const [value, setValue] = useState(1); // 기본값 1 (원래 색상)
  const [inputValue, setInputValue] = useState("1"); // 텍스트 입력 값

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // 입력된 값이 0에서 1 사이의 숫자이면 value로 설정
    const numericValue = parseFloat(newValue);
    if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 1) {
      setValue(numericValue);
    }
  };

  const color = getHSLColor(value);

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          width: "100px",
          height: "100px",
          backgroundColor: color,
          border: "1px solid black",
          marginBottom: "10px",
        }}
      />
      <div>
        <label>
          Lightness Control (0 to 1):
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            style={{ marginLeft: "10px" }}
          />
        </label>
      </div>
      <p>Selected HEX Color: {color}</p>
    </div>
  );
};

export default ColorGradient;
