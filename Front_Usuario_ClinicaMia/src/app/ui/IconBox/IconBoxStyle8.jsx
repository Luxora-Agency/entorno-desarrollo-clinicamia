import Image from 'next/image';

export default function IconBoxStyle8({ title, subTitle, iconUrl }) {
  return (
    <div className="cs_iconbox cs_style_8 text-center cs_radius_20">
      <div className="cs_iconbox_icon rounded-circle cs_center">
        <Image src={iconUrl} alt="Icon" height={35} width={35} />
      </div>
      <h2 className="cs_iconbox_title cs_semibold cs_fs_32">{title}</h2>
      <p className="cs_iconbox_subtitle m-0">{subTitle}</p>
    </div>
  );
}
