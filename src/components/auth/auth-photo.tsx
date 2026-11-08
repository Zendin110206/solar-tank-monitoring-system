import { getImageProps } from "next/image";

// Gambar 1x1 transparan untuk layar kecil, tempat panel foto disembunyikan.
const EMPTY_IMAGE =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

// Foto latar panel kanan (tangki bahan bakar saat senja). Gambar hiasan, jadi
// `alt` kosong. Foto hanya disediakan untuk layar lebar lewat <picture>:
// di desktop browser memintanya sejak awal dengan prioritas tinggi, di tablet
// dan ponsel browser memakai gambar kosong dan tidak mengunduh foto sama sekali.
export function AuthPhoto() {
  const {
    props: { sizes, srcSet },
  } = getImageProps({
    alt: "",
    height: 1024,
    sizes: "64vw",
    src: "/brand/masuk-latar.webp",
    width: 1535,
  });

  return (
    <picture>
      <source media="(min-width: 64rem)" sizes={sizes} srcSet={srcSet} />
      <img
        alt=""
        className="absolute inset-0 size-full object-cover object-[70%_center] @min-[44rem]:object-right"
        decoding="async"
        fetchPriority="high"
        src={EMPTY_IMAGE}
      />
    </picture>
  );
}
