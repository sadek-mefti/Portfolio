import React from 'react';

export interface ActiveTextSelection {
  tkey: string;
  label: string;
  value: string;
  onChange: (nextVal: string) => void;
}

interface EditableTextProps {
  as?: React.ElementType;
  tkey: string;
  label?: string;
  value: string;
  onChange: (nextVal: string) => void;
  editing: boolean;
  customStyle?: { fontSizePct?: number; color?: string };
  onSelectForStyle?: (sel: ActiveTextSelection) => void;
  isSelected?: boolean;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

export const EditableText: React.FC<EditableTextProps> = ({
  as: Tag = 'span',
  tkey,
  label = 'Text',
  value,
  onChange,
  editing,
  customStyle,
  onSelectForStyle,
  isSelected,
  className = '',
  style,
  id
}) => {
  const mergedStyle: React.CSSProperties = {
    ...style,
    ...(customStyle?.fontSizePct && customStyle.fontSizePct !== 100
      ? { fontSize: `${customStyle.fontSizePct}%` }
      : {}),
    ...(customStyle?.color ? { color: customStyle.color } : {})
  };

  if (!editing) {
    return (
      <Tag id={id} className={className} style={mergedStyle} data-tkey={tkey}>
        {value}
      </Tag>
    );
  }

  return (
    <Tag
      id={id}
      data-tkey={tkey}
      className={`${className} editable-text-node${isSelected ? ' is-selected-text' : ''}`}
      style={mergedStyle}
      contentEditable
      suppressContentEditableWarning
      title={`Click to edit "${label}" text, size & color`}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        if (onSelectForStyle) {
          onSelectForStyle({ tkey, label, value, onChange });
        }
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        const nextText = e.currentTarget.innerText.trim();
        if (nextText !== value) {
          onChange(nextText);
        }
      }}
    >
      {value}
    </Tag>
  );
};
