// src/components/Earring2D.jsx
export default function Earring2D({ lobe }) {
  if (!lobe) return null;          // aún no hay datos
  const style = {
    position: 'absolute',
    left:  lobe.x,
    top:   lobe.y,
    transform: 'translate(-50%, -50%)',
    width: 64,
    pointerEvents: 'none'          // no bloquea clics
  };
  return <img src="../assets/react.svg" style={style} alt="" />;
}
