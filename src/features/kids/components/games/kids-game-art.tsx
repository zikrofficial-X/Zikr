"use client";

import { useId } from "react";
import { useLanguage } from "@/components/layout/language-provider";
import { getGameDefinition, type GameId } from "@/lib/games/registry";

const frame = "h-full w-full";

export function KidsGameArt({ gameId }: { gameId: GameId }) {
  const { isEnglish } = useLanguage();
  const definition = getGameDefinition(gameId);
  const label = definition
    ? (isEnglish ? definition.titleEn : definition.titleAr) +
      (isEnglish ? " game artwork" : " — رسمة اللعبة")
    : isEnglish
      ? "ZIKR Kids game artwork"
      : "رسمة لعبة من عالم ذِكر";
  const instanceId = useId().replace(/:/g, "");
  const backgroundId = gameId + "-" + instanceId + "-sky";
  const common = {
    className: frame,
    viewBox: "0 0 640 320",
    preserveAspectRatio: "xMidYMid slice" as const,
    role: "img" as const,
    "aria-label": label,
  };

  switch (gameId) {
    case "letter-lab":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={backgroundId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#533d86" />
              <stop offset="100%" stopColor="#132c3d" />
            </linearGradient>
          </defs>
          <rect
            width="640"
            height="320"
            rx="32"
            fill={`url(#${backgroundId})`}
          />
          <circle cx="520" cy="76" r="48" fill="#f3c969" opacity=".24" />
          <g transform="translate(86 84)">
            <rect
              width="128"
              height="154"
              rx="20"
              fill="#fff4cb"
              opacity=".94"
            />
            <text
              x="64"
              y="108"
              textAnchor="middle"
              fontSize="86"
              fontWeight="900"
              fill="#533d86"
            >
              أ
            </text>
          </g>
          <g transform="translate(256 84)">
            <rect
              width="128"
              height="154"
              rx="20"
              fill="#78d2b2"
              opacity=".94"
            />
            <text
              x="64"
              y="108"
              textAnchor="middle"
              fontSize="86"
              fontWeight="900"
              fill="#173d3b"
            >
              ب
            </text>
          </g>
          <g transform="translate(426 84)">
            <rect
              width="128"
              height="154"
              rx="20"
              fill="#9ab7f6"
              opacity=".94"
            />
            <text
              x="64"
              y="108"
              textAnchor="middle"
              fontSize="86"
              fontWeight="900"
              fill="#24356d"
            >
              ت
            </text>
          </g>
          <text
            x="34"
            y="42"
            fill="#fff4cb"
            fontSize="17"
            fontWeight="700"
            letterSpacing="2"
          >
            {isEnglish ? "LOOK • SAY • MATCH" : "انظر • انطق • طابق"}
          </text>
        </svg>
      );
    case "zikr-runner":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={backgroundId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#17665e" />
              <stop offset="100%" stopColor="#071b27" />
            </linearGradient>
          </defs>
          <rect
            width="640"
            height="320"
            rx="32"
            fill={"url(#" + backgroundId + ")"}
          />
          <circle cx="520" cy="68" r="35" fill="#ffe6a0" opacity=".9" />
          <circle cx="108" cy="94" r="3" fill="#fff4cb" />
          <circle cx="170" cy="54" r="4" fill="#fff4cb" />
          <circle cx="360" cy="72" r="3" fill="#fff4cb" />
          <path
            d="M0 205Q95 146 190 208T390 198T640 192V320H0Z"
            fill="#0c4545"
          />
          <path d="M0 252Q150 214 300 260T640 248V320H0Z" fill="#092b35" />
          <path
            d="M15 285Q160 254 320 286T625 275"
            fill="none"
            stroke="#f3c969"
            strokeOpacity=".55"
            strokeWidth="5"
            strokeDasharray="22 18"
          />
          <g transform="translate(150 197)">
            <path
              d="M0-42L12-15L42-12L20 8L26 38L0 23L-26 38L-20 8L-42-12L-12-15Z"
              fill="#f3c969"
              stroke="#fff1bc"
              strokeWidth="3"
            />
            <circle cx="-8" cy="-5" r="3.8" fill="#173d3b" />
            <circle cx="8" cy="-5" r="3.8" fill="#173d3b" />
            <path
              d="M-8 7Q0 15 8 7"
              fill="none"
              stroke="#173d3b"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M-12 28L-18 42M12 28L18 42"
              stroke="#5fd1a6"
              strokeWidth="7"
              strokeLinecap="round"
            />
          </g>
          <g transform="translate(420 148) rotate(12)">
            <path
              d="M0-23L7-7L24-6L11 6L15 23L0 14L-15 23L-11 6L-24-6L-7-7Z"
              fill="#fff0a8"
            />
            <circle cx="-5" cy="-2" r="2" fill="#6f591b" />
            <circle cx="5" cy="-2" r="2" fill="#6f591b" />
          </g>
          <rect x="470" y="235" width="20" height="34" rx="4" fill="#ef9870" />
          <path d="M460 237L480 206L500 237Z" fill="#ffd1a6" />
          <text
            x="34"
            y="42"
            fill="#fff4cb"
            opacity=".88"
            fontSize="17"
            fontWeight="700"
            letterSpacing="2"
          >
            {isEnglish ? "RUN • COLLECT • GROW" : "انطلق • اجمع • تقدّم"}
          </text>
        </svg>
      );
    case "zikr-memory":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={backgroundId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#34316c" />
              <stop offset="100%" stopColor="#10162e" />
            </linearGradient>
          </defs>
          <rect
            width="640"
            height="320"
            rx="32"
            fill={"url(#" + backgroundId + ")"}
          />
          <circle cx="540" cy="60" r="62" fill="#9085ed" opacity=".12" />
          <circle
            cx="540"
            cy="60"
            r="39"
            fill="none"
            stroke="#f3c969"
            strokeOpacity=".7"
            strokeWidth="2"
          />
          <g transform="translate(78 72)">
            <rect
              width="126"
              height="92"
              rx="18"
              fill="#66d5b0"
              fillOpacity=".2"
              stroke="#8be7ca"
              strokeWidth="2"
            />
            <path
              d="M63 20L75 43L101 45L82 62L87 83L63 70L39 83L44 62L25 45L51 43Z"
              fill="#8be7ca"
            />
          </g>
          <g transform="translate(257 72)">
            <rect
              width="126"
              height="92"
              rx="18"
              fill="#dfb4ff"
              fillOpacity=".17"
              stroke="#bda5ff"
              strokeWidth="2"
            />
            <path
              d="M62 17C45 38 38 48 38 61A24 24 0 0086 61C86 48 79 38 62 17Z"
              fill="#d3bfff"
            />
          </g>
          <g transform="translate(436 72)">
            <rect
              width="126"
              height="92"
              rx="18"
              fill="#f3c969"
              fillOpacity=".17"
              stroke="#f3c969"
              strokeWidth="2"
            />
            <circle cx="63" cy="46" r="24" fill="#f3c969" />
            <circle cx="71" cy="39" r="22" fill="#3b3976" />
          </g>
          <g transform="translate(165 192)">
            <rect
              width="126"
              height="92"
              rx="18"
              fill="#80c5ff"
              fillOpacity=".17"
              stroke="#80c5ff"
              strokeWidth="2"
            />
            <path d="M36 28H90V64H36Z" fill="#80c5ff" />
            <path
              d="M36 28L63 48L90 28"
              fill="none"
              stroke="#193b68"
              strokeWidth="4"
            />
          </g>
          <g transform="translate(344 192)">
            <rect
              width="126"
              height="92"
              rx="18"
              fill="#ffb4d1"
              fillOpacity=".17"
              stroke="#ffb4d1"
              strokeWidth="2"
            />
            <path
              d="M63 20L70 38L89 39L75 51L80 71L63 60L46 71L51 51L37 39L56 38Z"
              fill="#ffb4d1"
            />
          </g>
          <text
            x="34"
            y="42"
            fill="#fff4cb"
            opacity=".9"
            fontSize="17"
            fontWeight="700"
            letterSpacing="2"
          >
            {isEnglish ? "REMEMBER • MATCH" : "تذكّر • طابق"}
          </text>
        </svg>
      );
    case "wudu-challenge":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={backgroundId} x1="0" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor="#167ca1" />
              <stop offset="100%" stopColor="#092636" />
            </linearGradient>
          </defs>
          <rect
            width="640"
            height="320"
            rx="32"
            fill={"url(#" + backgroundId + ")"}
          />
          <path
            d="M0 220Q100 177 200 220T400 220T640 210V320H0Z"
            fill="#0a3448"
          />
          <g opacity=".24" stroke="#b5eeff" fill="none">
            <path d="M0 90H640M0 132H640M0 174H640" />
            <path d="M80 0V220M160 0V220M240 0V220M320 0V220M400 0V220M480 0V220M560 0V220" />
          </g>
          <path
            d="M318 48C291 88 273 110 273 139A45 45 0 00363 139C363 110 345 88 318 48Z"
            fill="#b9f0ff"
            stroke="#e2fbff"
            strokeWidth="3"
          />
          <path
            d="M296 139Q318 157 340 139"
            fill="none"
            stroke="#60c7ed"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {[
            [100, 205],
            [188, 240],
            [278, 205],
            [368, 240],
            [458, 205],
            [548, 240],
          ].map((point, index) => (
            <g
              key={index}
              transform={"translate(" + point[0] + " " + point[1] + ")"}
            >
              <circle
                r="25"
                fill={index < 3 ? "#daf7ff" : "#69cae9"}
                fillOpacity={index < 3 ? ".92" : ".38"}
                stroke="#b9f0ff"
                strokeWidth="2"
              />
              <text
                y="7"
                textAnchor="middle"
                fontSize="20"
                fontWeight="700"
                fill="#0a3448"
              >
                {index + 1}
              </text>
            </g>
          ))}
          <path
            d="M100 205L188 240L278 205L368 240L458 205L548 240"
            fill="none"
            stroke="#c8f4ff"
            strokeOpacity=".6"
            strokeWidth="3"
            strokeDasharray="6 8"
          />
          <text
            x="34"
            y="42"
            fill="#e5faff"
            fontSize="17"
            fontWeight="700"
            letterSpacing="2"
          >
            {isEnglish ? "WUDU • STEP BY STEP" : "الوضوء • خطوة بخطوة"}
          </text>
        </svg>
      );
    case "verse-puzzle":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={backgroundId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#563784" />
              <stop offset="100%" stopColor="#17132e" />
            </linearGradient>
          </defs>
          <rect
            width="640"
            height="320"
            rx="32"
            fill={"url(#" + backgroundId + ")"}
          />
          <path
            d="M150 280V137A170 170 0 01490 137V280Z"
            fill="#241c48"
            stroke="#d0b0ff"
            strokeOpacity=".45"
            strokeWidth="4"
          />
          <path
            d="M180 280V145A140 140 0 01460 145V280Z"
            fill="#13192f"
            stroke="#f3c969"
            strokeOpacity=".45"
            strokeWidth="2"
          />
          <g transform="translate(225 99)">
            <rect width="190" height="125" rx="12" fill="#f3d99b" />
            <rect
              x="12"
              y="12"
              width="166"
              height="101"
              rx="8"
              fill="#fff5d9"
              stroke="#b88a3b"
              strokeWidth="2"
            />
            <path
              d="M26 37H164M26 57H164M26 77H164M26 97H164"
              stroke="#bda36e"
              strokeOpacity=".55"
              strokeWidth="2"
            />
          </g>
          <g transform="translate(90 226)">
            <rect
              width="100"
              height="58"
              rx="13"
              fill="#6e55ad"
              stroke="#c6aaff"
              strokeWidth="2"
            />
            <text
              x="50"
              y="39"
              textAnchor="middle"
              fill="#fff1ca"
              fontSize="29"
            >
              ذ
            </text>
          </g>
          <g transform="translate(270 226)">
            <rect
              width="100"
              height="58"
              rx="13"
              fill="#8a6bc6"
              stroke="#d5c0ff"
              strokeWidth="2"
            />
            <text
              x="50"
              y="39"
              textAnchor="middle"
              fill="#fff1ca"
              fontSize="29"
            >
              ك
            </text>
          </g>
          <g transform="translate(450 226)">
            <rect
              width="100"
              height="58"
              rx="13"
              fill="#6e55ad"
              stroke="#c6aaff"
              strokeWidth="2"
            />
            <text
              x="50"
              y="39"
              textAnchor="middle"
              fill="#fff1ca"
              fontSize="29"
            >
              ر
            </text>
          </g>
          <text
            x="34"
            y="42"
            fill="#fff4cb"
            fontSize="17"
            fontWeight="700"
            letterSpacing="2"
          >
            {isEnglish ? "VERSE • PLACE EACH WORD" : "لغز الآية • ضع كل كلمة"}
          </text>
        </svg>
      );
    case "zikr-quiz":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={backgroundId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2057a8" />
              <stop offset="100%" stopColor="#0b1736" />
            </linearGradient>
          </defs>
          <rect
            width="640"
            height="320"
            rx="32"
            fill={"url(#" + backgroundId + ")"}
          />
          <circle
            cx="320"
            cy="154"
            r="90"
            fill="#7bb8ff"
            fillOpacity=".1"
            stroke="#7bb8ff"
            strokeOpacity=".3"
            strokeWidth="3"
          />
          <g transform="translate(278 58)">
            <path d="M14 0H70L63 36L76 54H8L21 36Z" fill="#f3c969" />
            <path
              d="M40 54V74M18 74H62"
              stroke="#f3c969"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </g>
          <rect
            x="70"
            y="206"
            width="145"
            height="68"
            rx="18"
            fill="#7ab8ff"
            fillOpacity=".25"
            stroke="#9fcdff"
            strokeWidth="2"
          />
          <rect
            x="248"
            y="206"
            width="145"
            height="68"
            rx="18"
            fill="#f3c969"
            fillOpacity=".24"
            stroke="#f3c969"
            strokeWidth="2"
          />
          <rect
            x="426"
            y="206"
            width="145"
            height="68"
            rx="18"
            fill="#93e5c8"
            fillOpacity=".22"
            stroke="#93e5c8"
            strokeWidth="2"
          />
          <text
            x="142"
            y="249"
            textAnchor="middle"
            fill="#e8f5ff"
            fontSize="24"
            fontWeight="700"
          >
            A
          </text>
          <text
            x="320"
            y="249"
            textAnchor="middle"
            fill="#fff1c1"
            fontSize="24"
            fontWeight="700"
          >
            B
          </text>
          <text
            x="498"
            y="249"
            textAnchor="middle"
            fill="#d9fff0"
            fontSize="24"
            fontWeight="700"
          >
            C
          </text>
          <text
            x="34"
            y="42"
            fill="#e5f3ff"
            fontSize="17"
            fontWeight="700"
            letterSpacing="2"
          >
            {isEnglish ? "THINK • CHOOSE • LEARN" : "فكّر • اختر • تعلّم"}
          </text>
          <g transform="translate(320 151)">
            <circle r="43" fill="#f3c969" stroke="#ffe9a4" strokeWidth="4" />
            <text
              y="18"
              textAnchor="middle"
              fill="#17335c"
              fontSize="52"
              fontWeight="800"
            >
              ؟
            </text>
          </g>
        </svg>
      );
    case "mosque-adventure":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={backgroundId} x1="0" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor="#286e68" />
              <stop offset="100%" stopColor="#092b35" />
            </linearGradient>
          </defs>
          <rect
            width="640"
            height="320"
            rx="32"
            fill={"url(#" + backgroundId + ")"}
          />
          <circle cx="515" cy="78" r="43" fill="#f3c969" opacity=".8" />
          <path
            d="M0 238Q130 195 250 240T480 231T640 236V320H0Z"
            fill="#0c4a44"
          />
          <path
            d="M210 280V165Q210 80 295 80Q380 80 380 165V280Z"
            fill="#10414a"
            stroke="#f6d58a"
            strokeOpacity=".65"
            strokeWidth="5"
          />
          <path
            d="M250 280V172Q250 125 295 125Q340 125 340 172V280Z"
            fill="#081f2b"
            stroke="#f6d58a"
            strokeOpacity=".7"
            strokeWidth="3"
          />
          <path d="M280 80Q295 40 310 80" fill="#f3c969" />
          <path d="M280 80H310" stroke="#f3c969" strokeWidth="5" />
          <path
            d="M0 320Q160 250 280 300T640 300V320Z"
            fill="#b28a50"
            fillOpacity=".5"
          />
          <path
            d="M84 280Q124 235 164 280M460 280Q500 235 540 280"
            fill="none"
            stroke="#73cda6"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {[
            [120, 183],
            [472, 170],
            [530, 230],
          ].map((point, index) => (
            <g
              key={index}
              transform={"translate(" + point[0] + " " + point[1] + ")"}
            >
              <circle r="20" fill={index === 1 ? "#f3c969" : "#73cda6"} />
              <circle cx="-6" cy="-4" r="2.8" fill="#123a3a" />
              <circle cx="6" cy="-4" r="2.8" fill="#123a3a" />
              <path
                d="M-5 5Q0 10 5 5"
                fill="none"
                stroke="#123a3a"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          ))}
          <path
            d="M320 300L320 252M306 266L320 252L334 266"
            fill="none"
            stroke="#f3c969"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text
            x="34"
            y="42"
            fill="#fff4cb"
            fontSize="17"
            fontWeight="700"
            letterSpacing="2"
          >
            {isEnglish ? "EXPLORE • DISCOVER" : "استكشف • اكتشف"}
          </text>
        </svg>
      );
    case "zikr-road":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={backgroundId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#eea85c" />
              <stop offset="100%" stopColor="#253b55" />
            </linearGradient>
          </defs>
          <rect
            width="640"
            height="320"
            rx="32"
            fill={"url(#" + backgroundId + ")"}
          />
          <circle cx="500" cy="66" r="35" fill="#ffe6a7" opacity=".92" />
          <path
            d="M0 180Q110 140 230 184T470 178T640 180V320H0Z"
            fill="#244e4b"
          />
          <path d="M240 320L292 152H351L420 320Z" fill="#25333a" />
          <path d="M293 152L0 320H240Z" fill="#33444a" />
          <path d="M351 152L640 320H420Z" fill="#33444a" />
          <path
            d="M321 174L322 202M324 224L326 250M331 272L334 302"
            stroke="#f7dc9c"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="8 8"
          />
          <g transform="translate(325 188)">
            <rect
              x="-24"
              y="-17"
              width="48"
              height="34"
              rx="9"
              fill="#e7c36f"
            />
            <circle cx="-14" cy="17" r="7" fill="#17232c" />
            <circle cx="14" cy="17" r="7" fill="#17232c" />
            <rect
              x="-14"
              y="-10"
              width="28"
              height="12"
              rx="4"
              fill="#f8e8b9"
            />
          </g>
          <g transform="translate(105 203)">
            <path d="M-30 0H30L20 -52H-20Z" fill="#d98c64" />
            <path d="M-37 -52H37L20 -69H-20Z" fill="#ffe4aa" />
            <text
              y="-25"
              textAnchor="middle"
              fill="#583c30"
              fontSize="28"
              fontWeight="700"
            >
              ?
            </text>
          </g>
          <path
            d="M478 235l24 24l-24 24M495 259h42"
            fill="none"
            stroke="#8ce0ba"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text
            x="34"
            y="42"
            fill="#fff8df"
            fontSize="17"
            fontWeight="700"
            letterSpacing="2"
          >
            {isEnglish ? "NOTICE • DECIDE • MOVE" : "لاحظ • قرر • تحرّك"}
          </text>
        </svg>
      );
    case "zikr-jump":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={backgroundId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6853a7" />
              <stop offset="100%" stopColor="#172445" />
            </linearGradient>
          </defs>
          <rect
            width="640"
            height="320"
            rx="32"
            fill={"url(#" + backgroundId + ")"}
          />
          <circle cx="530" cy="68" r="38" fill="#f9d58c" opacity=".85" />
          <circle cx="95" cy="65" r="3" fill="#fff1d1" />
          <circle cx="150" cy="110" r="4" fill="#fff1d1" />
          <circle cx="410" cy="55" r="3" fill="#fff1d1" />
          <path d="M0 275Q140 250 260 278T640 265V320H0Z" fill="#102d3b" />
          <path
            d="M70 237Q155 112 243 180T410 128T580 185"
            fill="none"
            stroke="#f3c969"
            strokeOpacity=".4"
            strokeWidth="5"
            strokeDasharray="8 12"
          />
          <g>
            <rect
              x="38"
              y="232"
              width="115"
              height="24"
              rx="12"
              fill="#6fd7b7"
            />
            <rect
              x="189"
              y="184"
              width="104"
              height="24"
              rx="12"
              fill="#9b8aff"
            />
            <rect
              x="338"
              y="145"
              width="112"
              height="24"
              rx="12"
              fill="#f3c969"
            />
            <rect
              x="486"
              y="185"
              width="112"
              height="24"
              rx="12"
              fill="#6fd7b7"
            />
          </g>
          <g transform="translate(304 116)">
            <path
              d="M0-30L9-11L30-9L15 6L19 28L0 17L-19 28L-15 6L-30-9L-9-11Z"
              fill="#f3c969"
              stroke="#fff1bc"
              strokeWidth="3"
            />
            <circle cx="-6" cy="-2" r="3" fill="#4b3d77" />
            <circle cx="6" cy="-2" r="3" fill="#4b3d77" />
            <path
              d="M-6 7Q0 12 6 7"
              fill="none"
              stroke="#4b3d77"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
          <path
            d="M288 150Q305 164 322 150"
            fill="none"
            stroke="#bcaeff"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <text
            x="34"
            y="42"
            fill="#fff4cb"
            fontSize="17"
            fontWeight="700"
            letterSpacing="2"
          >
            {isEnglish
              ? "JUMP • LAND • TRY AGAIN"
              : "اقفز • اهبط • جرّب من جديد"}
          </text>
        </svg>
      );
    case "good-deeds":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={backgroundId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#874d70" />
              <stop offset="100%" stopColor="#153e39" />
            </linearGradient>
          </defs>
          <rect
            width="640"
            height="320"
            rx="32"
            fill={"url(#" + backgroundId + ")"}
          />
          <circle cx="520" cy="65" r="46" fill="#f6d18d" opacity=".82" />
          <path
            d="M0 245Q120 210 250 248T500 238T640 244V320H0Z"
            fill="#113d35"
          />
          <g transform="translate(165 145)">
            <circle cy="-25" r="24" fill="#f7c9a5" />
            <path
              d="M-27-29Q-24-58 0-50Q25-55 28-25L20-36H-18Z"
              fill="#513a48"
            />
            <path
              d="M0 0V63M-34 23L0 43L36 18"
              fill="none"
              stroke="#eeb0ce"
              strokeWidth="17"
              strokeLinecap="round"
            />
            <path
              d="M-20 65L-34 92M20 65L34 92"
              stroke="#f6d18d"
              strokeWidth="12"
              strokeLinecap="round"
            />
          </g>
          <g transform="translate(320 215)">
            <path
              d="M0 23V-22"
              stroke="#a6dd9a"
              strokeWidth="11"
              strokeLinecap="round"
            />
            <path d="M0-5Q-42-12-41-42Q-8-45 0-5Z" fill="#8bdb9f" />
            <path d="M0-10Q42-19 40-49Q10-44 0-10Z" fill="#5ecb94" />
            <path d="M-23 25H23L17 51H-17Z" fill="#c58b64" />
          </g>
          <g transform="translate(475 142)">
            <circle cy="-25" r="24" fill="#cce3f7" />
            <path
              d="M-30-22Q-25-54 0-50Q26-51 30-20L18-34H-18Z"
              fill="#244d65"
            />
            <path
              d="M0 0V60M-34 18L0 38L35 12"
              fill="none"
              stroke="#75d6b1"
              strokeWidth="17"
              strokeLinecap="round"
            />
          </g>
          <path
            d="M253 125C235 104 204 124 218 145L253 174L288 145C302 124 271 104 253 125Z"
            fill="#ffb9d4"
            stroke="#ffe0eb"
            strokeWidth="3"
          />
          <text
            x="34"
            y="42"
            fill="#fff4cb"
            fontSize="17"
            fontWeight="700"
            letterSpacing="2"
          >
            {isEnglish ? "KINDNESS • HELP • SHARE" : "لطف • مساعدة • مشاركة"}
          </text>
        </svg>
      );
    case "hilal-fly":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={backgroundId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#202e72" />
              <stop offset="100%" stopColor="#080f2e" />
            </linearGradient>
          </defs>
          <rect
            width="640"
            height="320"
            rx="32"
            fill={"url(#" + backgroundId + ")"}
          />
          <circle cx="520" cy="72" r="55" fill="#fff1bb" opacity=".08" />
          <circle
            cx="520"
            cy="72"
            r="39"
            fill="none"
            stroke="#fff1bb"
            strokeOpacity=".24"
            strokeWidth="2"
          />
          {[
            [72, 78],
            [145, 130],
            [235, 62],
            [416, 72],
            [565, 173],
            [385, 220],
            [90, 256],
          ].map((point, index) => (
            <g key={index}>
              <circle
                cx={point[0]}
                cy={point[1]}
                r={index % 2 === 0 ? 3 : 2}
                fill="#fff4cb"
                opacity=".9"
              />
              <path
                d={
                  "M" +
                  (point[0] - 5) +
                  " " +
                  point[1] +
                  "h10M" +
                  point[0] +
                  " " +
                  (point[1] - 5) +
                  "v10"
                }
                stroke="#fff4cb"
                strokeOpacity=".65"
                strokeWidth="1.5"
              />
            </g>
          ))}
          <path
            d="M126 235Q208 170 288 221T454 207T574 230"
            fill="none"
            stroke="#8da7ff"
            strokeOpacity=".32"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M325 70A77 77 0 1 0 390 187A60 60 0 0 1 325 70Z"
            fill="#f3c969"
            stroke="#ffe9a4"
            strokeWidth="3"
          />
          <circle cx="326" cy="135" r="3.5" fill="#6e4d25" />
          <circle cx="347" cy="132" r="3.5" fill="#6e4d25" />
          <path
            d="M324 148Q336 159 348 148"
            fill="none"
            stroke="#6e4d25"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <g transform="translate(470 205)">
            <path
              d="M0-22L7-7L23-6L11 5L14 22L0 14L-14 22L-11 5L-23-6L-7-7Z"
              fill="#fff1bb"
            />
            <circle cx="-5" cy="-2" r="2" fill="#27336b" />
            <circle cx="5" cy="-2" r="2" fill="#27336b" />
          </g>
          <text
            x="34"
            y="42"
            fill="#fff4cb"
            fontSize="17"
            fontWeight="700"
            letterSpacing="2"
          >
            {isEnglish ? "FLY • DODGE • SHINE" : "حلّق • تفادَ • أضئ"}
          </text>
        </svg>
      );
    case "mosque-cleanup":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={backgroundId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#426b45" />
              <stop offset="100%" stopColor="#132f32" />
            </linearGradient>
          </defs>
          <rect
            width="640"
            height="320"
            rx="32"
            fill={"url(#" + backgroundId + ")"}
          />
          <rect
            x="58"
            y="68"
            width="524"
            height="214"
            rx="24"
            fill="#0c2829"
            stroke="#91d5a0"
            strokeOpacity=".5"
            strokeWidth="3"
          />
          <path
            d="M58 112H582M58 164H582M58 216H582M180 68V282M308 68V282M436 68V282"
            stroke="#b2e7a8"
            strokeOpacity=".12"
            strokeWidth="2"
          />
          <g transform="translate(101 130)">
            <rect
              width="80"
              height="92"
              rx="12"
              fill="#f3c969"
              fillOpacity=".25"
              stroke="#f3c969"
              strokeWidth="3"
            />
            <path
              d="M13 25H67M13 42H67M13 59H52"
              stroke="#f3c969"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>
          <g transform="translate(259 130)">
            <path
              d="M0 40L42-8L84 40V87H0Z"
              fill="#79caea"
              fillOpacity=".3"
              stroke="#9eddf1"
              strokeWidth="3"
            />
            <rect x="33" y="52" width="19" height="35" rx="4" fill="#9eddf1" />
          </g>
          <g transform="translate(432 130)">
            <path
              d="M40 0L78 80H2Z"
              fill="#d1a8ff"
              fillOpacity=".3"
              stroke="#d1a8ff"
              strokeWidth="3"
            />
            <circle cx="40" cy="57" r="6" fill="#d1a8ff" />
          </g>
          <g transform="translate(320 242)">
            <path
              d="M-45-8H45L34 25H-34Z"
              fill="#8de0b4"
              fillOpacity=".35"
              stroke="#8de0b4"
              strokeWidth="3"
            />
            <path
              d="M-24-8V-30H24V-8"
              fill="none"
              stroke="#8de0b4"
              strokeWidth="4"
            />
          </g>
          <text
            x="34"
            y="42"
            fill="#efffe9"
            fontSize="17"
            fontWeight="700"
            letterSpacing="2"
          >
            {isEnglish ? "SORT • MATCH • ORGANIZE" : "صنّف • طابق • رتّب"}
          </text>
        </svg>
      );
    case "zikr-coloring":
      return (
        <svg {...common}>
          <defs>
            <linearGradient id={backgroundId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#714b88" />
              <stop offset="100%" stopColor="#261b3b" />
            </linearGradient>
          </defs>
          <rect
            width="640"
            height="320"
            rx="32"
            fill={"url(#" + backgroundId + ")"}
          />
          <rect
            x="55"
            y="48"
            width="398"
            height="238"
            rx="20"
            fill="#fff8df"
            stroke="#f3c969"
            strokeWidth="4"
          />
          <path
            d="M115 248V150Q115 105 160 105Q205 105 205 150V248Z"
            fill="#fff8df"
            stroke="#6c5486"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path
            d="M238 248V178Q238 146 270 146Q302 146 302 178V248Z"
            fill="#fff8df"
            stroke="#6c5486"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <circle
            cx="362"
            cy="102"
            r="30"
            fill="#fff8df"
            stroke="#6c5486"
            strokeWidth="5"
          />
          <path d="M362 77V127M337 102H387" stroke="#6c5486" strokeWidth="4" />
          <g transform="translate(516 110)">
            <circle r="63" fill="#fff8df" stroke="#f3c969" strokeWidth="4" />
            <circle cx="-22" cy="-18" r="15" fill="#ff7c9b" />
            <circle cx="22" cy="-18" r="15" fill="#69d2af" />
            <circle cx="-22" cy="22" r="15" fill="#7eb9f3" />
            <circle cx="22" cy="22" r="15" fill="#b29aff" />
            <circle r="12" fill="#ffd06f" />
          </g>
          <path
            d="M495 226L562 284"
            stroke="#e6c6ff"
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            d="M495 226L562 284"
            stroke="#fff8df"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path d="M554 276L576 293L569 265Z" fill="#f3c969" />
          <text
            x="480"
            y="212"
            textAnchor="middle"
            fill="#fff4cb"
            fontSize="17"
            fontWeight="700"
          >
            {isEnglish ? "PALETTE" : "ألوان"}
          </text>
          <text
            x="34"
            y="32"
            fill="#fff4cb"
            fontSize="17"
            fontWeight="700"
            letterSpacing="2"
          >
            {isEnglish ? "CREATE • COLOR • KEEP" : "ابتكر • لوّن • احتفظ"}
          </text>
        </svg>
      );
  }
}
