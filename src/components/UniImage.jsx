import { useEffect, useState } from "react";

// Фото університету із заглушкою: якщо фото немає або посилання бите, показуємо
// фірмовий фон з ініціалами закладу замість зламаної картинки й alt-тексту.
export default function UniImage({ src, name, className }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);

  if (!src || broken) {
    const initials = (name ?? "")
      .split(/[\s\-–/()]+/)
      .filter((w) => w.length > 2 && /^[A-ZÀ-Ý]/.test(w))
      .slice(0, 2)
      .map((w) => w[0])
      .join("");
    return (
      <div className={`${className} uni-img-placeholder`} aria-hidden="true">
        <span>{initials || "U"}</span>
      </div>
    );
  }
  return <img src={src} alt={name} className={className} loading="lazy" onError={() => setBroken(true)} />;
}
