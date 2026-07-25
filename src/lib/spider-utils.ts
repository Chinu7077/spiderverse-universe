import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { toPng } from "html-to-image";

export function useQR(text: string, size = 120) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: {
        dark: "#0a0a0a",
        light: "#ffffff",
      },
    })
      .then(setUrl)
      .catch(console.error);
  }, [text, size]);

  return url;
}

export async function downloadNode(node: HTMLElement, filename: string) {
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#05060d",
  });

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return dataUrl;
}

export async function shareNode(node: HTMLElement, filename: string, text: string) {
  const dataUrl = await toPng(node, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: "#05060d",
  });

  const response = await fetch(dataUrl);
  const blob = await response.blob();

  const file = new File([blob], filename, {
    type: "image/png",
  });

  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({
      title: "Spider Society",
      text,
      files: [file],
    });
    return;
  }

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
}

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}

export function useKonami(onUnlock: () => void) {
  const sequence = useRef<string[]>([]);

  const code = [
    "ArrowUp",
    "ArrowUp",
    "ArrowDown",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "ArrowLeft",
    "ArrowRight",
    "b",
    "a",
  ];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

      sequence.current.push(key);

      if (sequence.current.length > code.length) {
        sequence.current.shift();
      }

      if (sequence.current.join(",") === code.join(",")) {
        onUnlock();
        sequence.current = [];
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, [onUnlock]);
}
