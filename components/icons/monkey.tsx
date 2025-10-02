import type { SVGProps } from "react"
const MonkeyIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 160 160" {...props}>
    <g transform="translate(0,160) scale(0.1,-0.1)" fill="currentColor" stroke="none">
      <path
        d="M0 800 l0 -800 800 0 800 0 0 800 0 800 -800 0 -800 0 0 -800z m720
190 l0 -60 -70 0 -70 0 0 -215 0 -215 -55 0 -55 0 0 215 0 215 -70 0 -70 0 0
60 0 60 195 0 195 0 0 -60z m160 -91 l0 -151 51 44 c28 23 57 47 64 52 9 7 28
-4 67 -38 l53 -49 3 147 3 146 54 0 55 0 0 -270 c0 -148 -2 -270 -5 -270 -3 0
-47 37 -98 82 -50 45 -99 88 -108 95 -14 11 -30 0 -124 -82 -59 -52 -112 -95
-116 -95 -5 0 -9 122 -9 270 l0 270 55 0 55 0 0 -151z"
      />
    </g>
  </svg>
)
export default MonkeyIcon
