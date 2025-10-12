import { presetDarkPalettes, presetPalettes } from '@ant-design/colors';

import type { IntRange } from 'type-fest';
/** 需要引入的颜色名称 */
const PalleteNames = [
  'red',
  'volcano',
  'orange',
  'gold',
  'yellow',
  'lime',
  'green',
  'cyan',
  'blue',
  'geekblue',
  'purple',
  'magenta',
  'grey',
] as const;

type N = (typeof PalleteNames)[number];
type R = IntRange<1, 10>;
type R2 = `${R}00` | '50';
/** 动态生成每个颜色的色板类型，以 red 为例，包括 red, red-50, red-100 到 red-900。*/
type Pallete = Record<N, string> & Record<`${N}-${R2}`, string>;

/**
 * 将 antd 的色板，转换成 tailwind 的常见色板名称体系，即 -red-50, -red-100 到 -red-900。
 * 同时，为了方便使用，增加了 -red 主色名，和 -red-500 等价。
 * 此外，参考 https://ant.design/docs/spec/colors，增加了常用颜色名称的映射。
 */
export interface AntdThemeColors extends Pallete {
  background: string;
  primary: string;
  'selected-background': string;
  hover: string;
  click: string;
  success: string;
  link: string;
  warning: string;
  error: string;
  'leading-text': string;
  'normal-text': string;
  'secondary-text': string;
  'disabled-text': string;
  border: string;
  separator: string;
  divider: string;
  'layout-background': string;
  white: string;
  black: string;
  transparent: string;
  'current-color': string;
}
/**
 * 将 antd 的色板，转换成 tailwind 的常见色板名称体系，即 -red-50, -red-100 到 -red-900。
 * 同时，为了方便使用，增加了 -red 主色名，和 -red-500 等价。
 * 此外，参考 https://ant.design/docs/spec/colors，增加了常用颜色名称的映射。
 *
 * -
 * 示例：
 *
 * ```html
 * <div className="text-brand text-success text-warning text-error">hello, world</div>
 * ```
 */
function AntdColors(dark = false) {
  const colors = {} as unknown as AntdThemeColors;
  PalleteNames.forEach((name) => {
    const clr = (dark ? presetDarkPalettes : presetPalettes)[name];
    // if (!clr) {
    //   console.log(dark, name, Object.keys(presetPalettes), presetPalettes[name]);
    // }
    Object.assign(colors, {
      ...Object.fromEntries(
        clr.map((c, i) => [`${name}-${i === 0 ? 50 : i * 100}`, c]),
      ),
      [name]: clr.primary ?? clr[5],
    });
  });
  /** https://ant.design/docs/spec/colors **/
  colors.primary = colors.blue; // 品牌主色，brand primary color
  colors['selected-background'] = colors['blue-50'];
  colors.hover = colors['blue-400'];
  colors.click = colors['blue-600'];
  colors.success = colors.green;
  colors.link = colors.blue;
  colors.warning = colors.gold;
  colors.error = colors['red-400'];
  colors.background = dark ? '#141414' : '#fff';
  colors['leading-text'] = dark
    ? 'rgba(255,255,255,0.851)'
    : 'rgba(0, 0, 0, 0.8784)';
  colors['normal-text'] = dark
    ? 'rgba(255,255,255,0.851)'
    : 'rgba(0, 0, 0, 0.8784)';
  colors['secondary-text'] = dark
    ? 'rgba(255,255,255,0.651)'
    : 'rgba(0, 0, 0, 0.651)';
  colors['disabled-text'] = dark
    ? 'rgba(255,255,255,0.251)'
    : 'rgba(0, 0, 0, 0.251)';
  colors.border = dark ? '#424242' : '#d9d9d9';
  colors.separator = dark
    ? 'rgba(253,253,253,0.1216)'
    : 'rgba(5, 5, 5, 0.0588)';
  colors.divider = dark ? 'rgba(253,253,253,0.1216)' : 'rgba(5, 5, 5, 0.0588)';
  colors['layout-background'] = dark ? '#000' : '#f5f5f5';
  colors.white = '#ffffff';
  colors.black = '#000000';
  colors.transparent = 'transparent';
  colors['current-color'] = 'currentcolor';
  return colors;
}

/**
 * 将 antd 的色板，转换成 tailwind 的常见色板名称体系，即 -red-50, -red-100 到 -red-900。
 * 同时，为了方便使用，增加了 -red 主色名，和 -red-500 等价。
 * 此外，参考 https://ant.design/docs/spec/colors，增加了常用颜色名称的映射。
 *
 * tailwind.config.js 配置文件和业务模块代码都从此文件中引用色板，
 * 从而统一 html 和 js（比如 echarts） 的样式。
 */
export function getThemeColors() {
  return AntdColors();
}

export function getThemeDarkColors() {
  return AntdColors(true);
}
export function getThemeTailwindColors() {
  const themeColors = getThemeColors();
  const themeDarkColors = getThemeDarkColors();
  const twColors: Record<string, string> = {};
  const cssVars: Record<string, string> = {};
  const cssDarkVars: Record<string, string> = {};
  // function hex2rgb(hexClr: string) {
  //   const s = hexClr.slice(1);
  //   const rgb = [0, 0, 0];
  //   if (s.length === 3) {
  //     rgb[0] = parseInt(s[0] + s[0], 16);
  //     rgb[1] = parseInt(s[1] + s[1], 16);
  //     rgb[2] = parseInt(s[2] + s[2], 16);
  //   } else {
  //     rgb[0] = parseInt(s.slice(0, 2), 16);
  //     rgb[1] = parseInt(s.slice(2, 4), 16);
  //     rgb[2] = parseInt(s.slice(4, 6), 16);
  //   }
  //   return rgb.join(' ');
  // }
  Object.keys(themeColors).forEach((name) => {
    const color = (themeColors as any)[name] as string;
    const darkColor = (themeDarkColors as any)[name] as string;
    const n = `--antd-${name}`;

    // 从 tailwind v4 开始不再需要使用 rgb 搭配 <alpha-value> 的方式实现透明。
    // if (color.startsWith('#')) {
    //   const n2 = `--antd-rgb-${name}`;
    //   cssVars[n2] = hex2rgb(color);
    //   cssDarkVars[n2] = hex2rgb(darkColor);
    //   twColors[name] = `rgb(var(${n2}) / <alpha-value>)`;
    // } else {
    //   twColors[name] = `var(${n})`;
    // }

    twColors[name] = `var(${n})`;
    cssVars[n] = color;
    cssDarkVars[n] = darkColor;
  });
  return {
    twColors,
    cssVars,
    cssDarkVars,
  };
}

export function getTailwindThemeCss() {
  const themeTailwindColors = getThemeTailwindColors();
  function obj2css(obj: Record<string, string>) {
    return Object.keys(obj)
      .map((name) => `  ${name}: ${obj[name]};`)
      .join('\n');
  }
  return `@theme inline {
${Object.keys(themeTailwindColors.twColors)
  .map((name) => `  --color-${name}: ${themeTailwindColors.twColors[name]};`)
  .join('\n')}
}
:root {
${obj2css(themeTailwindColors.cssVars)}
}
[data-theme=dark] {
${obj2css(themeTailwindColors.cssDarkVars)}
}`;
}
