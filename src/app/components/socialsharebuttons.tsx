"use client";

import { Facebook, Twitter, Instagram, LinkIcon } from "lucide-react";
import { SiTiktok, SiLinkedin } from "react-icons/si";
import { Button } from "@/app/components/ui/button";

interface Props {
  videoUrl: string;
}

export default function SocialShareButtons({ videoUrl }: Props) {
  const shareText = encodeURIComponent("Check out my ad made with Fast Ad!");
  const encodedUrl = encodeURIComponent(videoUrl);

  const links = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${shareText}`,
    instagram: `https://www.instagram.com/`, // placeholder; IG doesn't support direct video sharing via URL
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    tiktok: `https://www.tiktok.com/upload`, // TikTok doesn't support direct share URL; this is a placeholder
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(videoUrl);
    alert("Link copied to clipboard!");
  };

  return (
    <div className="flex gap-4 items-center">
      <a href={links.facebook} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="icon">
          <Facebook className="w-5 h-5" />
        </Button>
      </a>
      <a href={links.twitter} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="icon">
          <Twitter className="w-5 h-5" />
        </Button>
      </a>
      <a href={links.instagram} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="icon">
          <Instagram className="w-5 h-5" />
        </Button>
      </a>
      <a href={links.linkedin} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="icon">
          <SiLinkedin className="w-5 h-5" />
        </Button>
      </a>
      <a href={links.tiktok} target="_blank" rel="noopener noreferrer">
        <Button variant="outline" size="icon">
          <SiTiktok className="w-5 h-5" />
        </Button>
      </a>
      <Button variant="outline" size="icon" onClick={copyToClipboard}>
        <LinkIcon className="w-5 h-5" />
      </Button>
    </div>
  );
}
