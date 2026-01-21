import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { uploadBlogImage } from '@/lib/storage';
import { toast } from 'sonner';
import './Blog.css';

// Динамический импорт ReactQuill для избежания проблем с SSR и порталами
const ReactQuill = lazy(() => import('react-quill').then((module) => ({ default: module.default })));

interface BlogEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const quillModules = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ size: ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ script: 'sub' }, { script: 'super' }],
      [{ align: [] }],
      [{ indent: '-1' }, { indent: '+1' }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ direction: 'rtl' }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean'],
    ],
    handlers: {
      image: function (this: any) {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.onchange = async () => {
          const file = (input.files || [])[0];
          if (!file) return;
          try {
            const url = await uploadBlogImage(file, 'content');
            const quill = this.quill;
            if (!quill) return;

            const range = quill.getSelection(true);
            if (range && range.index !== null) {
              quill.insertEmbed(range.index, 'image', url);
            } else {
              const length = quill.getLength();
              quill.insertEmbed(Math.max(0, length - 1), 'image', url);
            }
          } catch (error: any) {
            toast.error(error.message || 'Не удалось загрузить изображение');
          }
        };
        input.click();
      },
    },
  },
};

export function BlogEditor({ value, onChange, placeholder }: BlogEditorProps) {
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Нормализуем value: всегда строка, никогда null/undefined
  const normalizedValue = value ?? '';

  // Ждем полного монтирования и открытия Dialog
  useEffect(() => {
    setIsReady(false);
    // Увеличиваем задержку для гарантии, что Dialog полностью открыт
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 300);

    return () => {
      clearTimeout(timer);
      setIsReady(false);
    };
  }, []);

  if (!isReady) {
    return (
      <div className="flex h-64 items-center justify-center rounded-md border border-border bg-muted/50">
        <div className="text-sm text-muted-foreground">Загрузка редактора...</div>
      </div>
    );
  }

  return (
    <div className="blog-editor-wrapper" ref={containerRef}>
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center rounded-md border border-border bg-muted/50">
            <div className="text-sm text-muted-foreground">Загрузка редактора...</div>
          </div>
        }
      >
        <ReactQuill
          theme="snow"
          value={normalizedValue}
          onChange={(val) => onChange(val ?? '')}
          placeholder={placeholder}
          className="bg-background text-foreground"
          modules={quillModules}
        />
      </Suspense>
    </div>
  );
}
