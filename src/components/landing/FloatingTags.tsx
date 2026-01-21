import React from "react";

interface FloatingTag {
  text: string;
  position: { top?: string; bottom?: string; left?: string; right?: string };
}

interface FloatingTagsProps {
  tags: FloatingTag[];
}

export const FloatingTags: React.FC<FloatingTagsProps> = ({ tags }) => {
  return (
    <>
      {tags.map((tag, index) => (
        <div
          key={index}
          className="landing-floating-tag"
          style={{
            top: tag.position.top,
            bottom: tag.position.bottom,
            left: tag.position.left,
            right: tag.position.right,
          }}
        >
          {tag.text}
        </div>
      ))}
    </>
  );
};






