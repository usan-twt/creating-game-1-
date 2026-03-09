export default function ClinicScene({ emotion, talking, ep, emotionColor, phoneCheck, breathingCalm }) {
  const { skin, shirt, hairColor, hairType } = ep;
  const isFemale = hairType==="f_young"||hairType==="f_old";
  const isOldMale = hairType==="m_elder";
  const shirtShadow = "#1a2418";
  const showBreath = ep.mechanics?.breathing && !breathingCalm;

  const exp = {
    neutral:    {browL:"M 106 143 C 113 138 122 138 132 141",browR:"M 148 141 C 158 138 167 138 174 143",browW:3.2,eyeH:9, mouth:"M 121 185 Q 140 194 159 185",sweat:false,tear:false},
    anxious:    {browL:"M 106 138 C 113 132 122 132 132 137",browR:"M 148 137 C 158 132 167 132 174 138",browW:3.2,eyeH:10,mouth:"M 123 187 Q 140 192 157 187",sweat:true, tear:false},
    exhausted:  {browL:"M 106 146 C 113 141 122 141 132 145",browR:"M 148 145 C 158 141 167 141 174 146",browW:2.8,eyeH:4, mouth:"M 124 188 Q 140 190 156 188",sweat:false,tear:false},
    conflicted: {browL:"M 106 140 C 112 133 121 135 128 142",browR:"M 152 142 C 159 135 168 133 174 140",browW:3.5,eyeH:8, mouth:"M 122 188 Q 140 193 158 188",sweat:true, tear:false},
    sad:        {browL:"M 106 146 C 113 140 122 141 132 147",browR:"M 148 147 C 158 141 167 140 174 146",browW:3.2,eyeH:7, mouth:"M 119 192 Q 140 184 161 192",sweat:false,tear:true },
    distressed: {browL:"M 106 135 C 112 128 121 128 132 134",browR:"M 148 134 C 158 128 167 128 174 135",browW:3.8,eyeH:11,mouth:"M 122 189 Q 140 193 158 189",sweat:true, tear:false},
    resigned:   {browL:"M 106 146 C 113 143 122 143 132 146",browR:"M 148 146 C 158 143 167 143 174 146",browW:2.5,eyeH:5, mouth:"M 122 188 Q 140 191 158 188",sweat:false,tear:false},
    resolute:   {browL:"M 106 141 C 113 137 122 137 132 141",browR:"M 148 141 C 158 137 167 137 174 141",browW:3.2,eyeH:9, mouth:"M 121 186 Q 140 192 159 186",sweat:false,tear:false},
  };
  const e = exp[emotion]||exp.neutral;
  const eyeH = talking ? Math.max(3,e.eyeH-3) : e.eyeH;

  return (
    <svg viewBox="0 0 280 320" style={{width:"100%",height:"100%",display:"block"}}>
      <defs>
        <linearGradient id="sc_wallG"  x1="0" y1="0" x2="0" y2="1"><stop offset="0%"   stopColor="#d0ccc4"/><stop offset="100%" stopColor="#c0bbb4"/></linearGradient>
        <linearGradient id="sc_flrG"   x1="0" y1="0" x2="0" y2="1"><stop offset="0%"   stopColor="#b8b4ac"/><stop offset="100%" stopColor="#a8a49c"/></linearGradient>
        <linearGradient id="sc_dskT"   x1="0" y1="0" x2="0" y2="1"><stop offset="0%"   stopColor="#ccc4b0"/><stop offset="100%" stopColor="#b8b098"/></linearGradient>
        <linearGradient id="sc_dskF"   x1="0" y1="0" x2="0" y2="1"><stop offset="0%"   stopColor="#a8a088"/><stop offset="100%" stopColor="#908870"/></linearGradient>
        <linearGradient id="sc_winG"   x1="0" y1="0" x2="0" y2="1"><stop offset="0%"   stopColor="#c4dcf0"/><stop offset="100%" stopColor="#d8eeff"/></linearGradient>
        <radialGradient id="sc_sunG"   cx="50%" cy="0%" r="80%"><stop offset="0%" stopColor="#fffae8" stopOpacity="0.3"/><stop offset="100%" stopColor="#fffae8" stopOpacity="0"/></radialGradient>
        <radialGradient id="sc_skinG"  cx="45%" cy="38%" r="65%"><stop offset="0%" stopColor={skin}/><stop offset="100%" stopColor={skin} stopOpacity="0.82"/></radialGradient>
        <radialGradient id="sc_sfaceG" cx="48%" cy="35%" r="60%"><stop offset="0%" stopColor="#e0a878" stopOpacity="0.55"/><stop offset="100%" stopColor={skin} stopOpacity="0"/></radialGradient>
        <linearGradient id="sc_shrtG"  x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={shirtShadow}/><stop offset="40%" stopColor={shirt}/><stop offset="100%" stopColor={shirtShadow}/></linearGradient>
        <filter id="sc_shadow" x="-15%" y="-10%" width="130%" height="130%"><feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#00000050"/></filter>
        <clipPath id="sc_eyeL"><ellipse cx="118" cy="157" rx="13" ry={eyeH+1}/></clipPath>
        <clipPath id="sc_eyeR"><ellipse cx="162" cy="157" rx="13" ry={eyeH+1}/></clipPath>
        <clipPath id="sc_clip"><rect width="280" height="320"/></clipPath>
      </defs>
      <g clipPath="url(#sc_clip)">
        <rect x="0" y="0"   width="280" height="215" fill="url(#sc_wallG)"/>
        <rect x="0" y="0"   width="280" height="215" fill="url(#sc_sunG)"/>
        <rect x="0" y="215" width="280" height="105" fill="url(#sc_flrG)"/>
        <rect x="170" y="22" width="96" height="72" rx="3" fill="url(#sc_winG)" stroke="#c4c0b8" strokeWidth="1.5"/>
        <rect x="216" y="22" width="2"  height="72" fill="#c8c4bc" opacity="0.7"/>
        <rect x="170" y="56" width="96" height="2"  fill="#c8c4bc" opacity="0.6"/>
        {[0,1,2,3,4,5].map(i=><rect key={i} x="172" y={24+i*10} width="92" height="7" fill="#dcd8d0" opacity="0.5" rx="1"/>)}
        <rect x="4" y="28" width="52" height="72" rx="2" fill="#e8e4df" stroke="#d0ccc4" strokeWidth="1"/>
        {[0,1,2,3,4,5,6].map(i=><rect key={i} x="8" y={42+i*8} width={28+(i%3)*8} height="4" rx="1" fill="#c4c0b8" opacity="0.7"/>)}
        {[0,1,2,3].map(r=>[0,1,2,3,4].map(c=><rect key={`t${r}${c}`} x={c*56} y={215+r*26} width="55" height="25" fill="none" stroke="#b0aca4" strokeWidth="0.5" opacity="0.5"/>))}

        <g filter="url(#sc_shadow)">
          <path d="M 95 232 Q 75 238 60 255 Q 48 268 46 320 L 234 320 Q 232 268 220 255 Q 205 238 185 232 Q 172 226 162 222 Q 152 238 140 240 Q 128 238 118 222 Q 108 226 95 232 Z" fill="url(#sc_shrtG)"/>
          <rect x="126" y="200" width="28" height="30" rx="10" fill="url(#sc_skinG)"/>
          <ellipse cx="140" cy="155" rx="52" ry="58" fill="url(#sc_skinG)"/>
          <ellipse cx="140" cy="155" rx="52" ry="58" fill="url(#sc_sfaceG)"/>

          {/* Hair */}
          <path d="M 90 128 Q 90 85 140 82 Q 190 85 190 128 Q 186 108 140 105 Q 94 108 90 128 Z" fill={hairColor}/>
          {isFemale&&<>
            <path d="M 90 125 Q 76 168 77 210 Q 77 220 84 217 Q 91 214 88 198 Q 84 172 90 140 Z" fill={hairColor} opacity="0.92"/>
            <path d="M 190 125 Q 204 168 203 210 Q 203 220 196 217 Q 189 214 192 198 Q 196 172 190 140 Z" fill={hairColor} opacity="0.92"/>
          </>}
          {hairType==="f_old"&&<><ellipse cx="156" cy="87" rx="19" ry="12" fill={hairColor}/><ellipse cx="163" cy="93" rx="12" ry="9" fill={hairColor} opacity="0.85"/></>}
          {isOldMale&&<>
            <path d="M 90 128 Q 92 100 140 98 Q 188 100 190 128 Q 178 112 140 110 Q 102 112 90 128 Z" fill={hairColor} opacity="0.5"/>
          </>}

          <ellipse cx="89"  cy="160" rx="8" ry="10" fill={skin}/>
          <ellipse cx="191" cy="160" rx="8" ry="10" fill={skin}/>
          <path d={e.browL} stroke={hairColor} strokeWidth={e.browW} fill="none" strokeLinecap="round"/>
          <path d={e.browR} stroke={hairColor} strokeWidth={e.browW} fill="none" strokeLinecap="round"/>
          <g clipPath="url(#sc_eyeL)">
            <ellipse cx="118" cy="157" rx="13" ry={eyeH}             fill="white"/>
            <ellipse cx="118" cy="157" rx="6"  ry={Math.min(eyeH,7)} fill="#2a1a0a"/>
            <ellipse cx="115" cy="154" rx="2"  ry="2"                fill="white" opacity="0.6"/>
          </g>
          <g clipPath="url(#sc_eyeR)">
            <ellipse cx="162" cy="157" rx="13" ry={eyeH}             fill="white"/>
            <ellipse cx="162" cy="157" rx="6"  ry={Math.min(eyeH,7)} fill="#2a1a0a"/>
            <ellipse cx="159" cy="154" rx="2"  ry="2"                fill="white" opacity="0.6"/>
          </g>
          <path d={`M 105 ${157-eyeH} Q 118 ${157-eyeH-3} 131 ${157-eyeH}`} stroke={hairColor} strokeWidth="1.5" fill="none" opacity="0.6"/>
          <path d={`M 149 ${157-eyeH} Q 162 ${157-eyeH-3} 175 ${157-eyeH}`} stroke={hairColor} strokeWidth="1.5" fill="none" opacity="0.6"/>
          <path d="M 136 162 Q 133 174 136 178 Q 140 180 144 178 Q 147 174 144 162" fill={skin} stroke="#b07848" strokeWidth="0.8" opacity="0.5"/>
          <path d={e.mouth} stroke="#8a4030" strokeWidth="2.2" fill="none" strokeLinecap="round"/>

          {(hairType==="f_old"||isOldMale)&&<g opacity="0.25">
            <path d="M 115 130 Q 140 127 165 130" stroke="#7a5030" strokeWidth="1" fill="none"/>
            <path d="M 103 168 Q 107 176 105 183" stroke="#7a5030" strokeWidth="0.9" fill="none"/>
            <path d="M 177 168 Q 173 176 175 183" stroke="#7a5030" strokeWidth="0.9" fill="none"/>
          </g>}
          {isOldMale&&ep.vitals?.SpO2?.startsWith("9")&&parseInt(ep.vitals.SpO2)<94&&
            <path d="M 105 173 Q 120 177 140 176 Q 160 177 175 173 Q 170 170 165 172 Q 152 176 140 175 Q 128 176 115 172 Q 110 170 105 173 Z" stroke="#c8e0f0" strokeWidth="1.2" fill="#c8e0f0" opacity="0.7"/>}

          {e.sweat&&<g><ellipse cx="184" cy="122" rx="3.5" ry="4.5" fill="#88ccee" opacity="0.85"/><path d="M 184 117 Q 181 118 181 122 Q 181 126 184 127 Q 184 122 184 117 Z" fill="#aaddff" opacity="0.6"/></g>}
          {e.tear&&<><path d="M 112 166 Q 110 174 112 182 Q 113 185 115 182 Q 115 175 113 168" fill="#88ccee" opacity="0.75"/><ellipse cx="112" cy="183" rx="3" ry="2" fill="#88ccee" opacity="0.65"/></>}
          {phoneCheck&&<g transform="translate(172,192) rotate(18)"><rect x="0" y="0" width="20" height="30" rx="3.5" fill="#222"/><rect x="2" y="3" width="16" height="22" rx="1.5" fill="#5090d8" opacity="0.88"/><rect x="7" y="1" width="6" height="2" rx="1" fill="#444"/></g>}
        </g>

        <rect x="0"   y="232" width="280" height="13" rx="2" fill="url(#sc_dskT)"/>
        <rect x="0"   y="232" width="280" height="2"  rx="1" fill="#d8d0b8" opacity="0.8"/>
        <path d="M 0 245 L 280 245 L 280 320 L 0 320 Z" fill="url(#sc_dskF)"/>
        <line x1="0" y1="245" x2="280" y2="245" stroke="#989070" strokeWidth="1.2"/>
        <rect x="18" y="220" width="12" height="14" rx="2" fill="#b4ac9c"/>
        <ellipse cx="140" cy="175" rx="70" ry="50" fill={emotionColor} opacity="0.09"/>
        {showBreath&&<ellipse cx="140" cy="218" rx="48" ry="7" fill={emotionColor} opacity="0.2" style={{animation:"breatheRing 1.4s ease-in-out infinite"}}/>}
      </g>
    </svg>
  );
}
