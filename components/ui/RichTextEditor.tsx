"use client";

import { useRef, useEffect, useState } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading,
  Paragraph,
  Link,
  List,
  BlockQuote,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  MediaEmbed,
  Indent,
  IndentBlock,
  Alignment,
  Font,
  HorizontalLine,
  RemoveFormat,
  FindAndReplace,
  SpecialCharacters,
  SpecialCharactersEssentials,
  GeneralHtmlSupport,
  Essentials,
  Undo,
  Image,
  ImageInsert,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageCaption,
  CodeBlock,
  Code,
  Highlight,
  Subscript,
  Superscript,
  PasteFromOffice,
  TextTransformation,
  AutoImage,
  AutoLink,
  FileRepository,
  SourceEditing,
  WordCount,
  PageBreak,
  TodoList,
  HtmlEmbed,
  Autoformat,
  ListProperties,
  TableColumnResize,
  LinkImage,
  SelectAll,
  ShowBlocks,
  PictureEditing,
  ImageBlock,
  ImageInline,
  MediaEmbedToolbar,
  type EditorConfig,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";

/**
 * Custom upload adapter that sends images to /api/media/presign.
 * Returns the public URL for the uploaded media.
 */
class MediaUploadAdapter {
  private loader: { file: Promise<File | null> };
  private controller: AbortController | null = null;

  constructor(loader: { file: Promise<File | null> }) {
    this.loader = loader;
  }

  async upload(): Promise<{ default: string }> {
    const file = await this.loader.file;
    if (!file) throw new Error("No file selected");
    this.controller = new AbortController();

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/media/presign", {
      method: "POST",
      body: formData,
      signal: this.controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(err.error || "Upload failed");
    }

    const data = await res.json();
    return { default: data.url };
  }

  abort() {
    this.controller?.abort();
  }
}

function MediaUploadAdapterPlugin(editor: unknown) {
  const ed = editor as ClassicEditor;
  ed.plugins.get("FileRepository").createUploadAdapter = (loader: { file: Promise<File | null> }) => {
    return new MediaUploadAdapter(loader);
  };
}

const EDITOR_CONFIG: EditorConfig = {
  plugins: [
    Essentials,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Heading,
    Paragraph,
    Link,
    List,
    BlockQuote,
    Table,
    TableToolbar,
    TableProperties,
    TableCellProperties,
    MediaEmbed,
    Indent,
    IndentBlock,
    Alignment,
    Font,
    HorizontalLine,
    RemoveFormat,
    FindAndReplace,
    SpecialCharacters,
    SpecialCharactersEssentials,
    GeneralHtmlSupport,
    Undo,
    Image,
    ImageInsert,
    ImageResize,
    ImageStyle,
    ImageToolbar,
    ImageCaption,
    CodeBlock,
    Code,
    Highlight,
    Subscript,
    Superscript,
    PasteFromOffice,
    TextTransformation,
    AutoImage,
    AutoLink,
    FileRepository,
    SourceEditing,
    WordCount,
    PageBreak,
    TodoList,
    HtmlEmbed,
    Autoformat,
    ListProperties,
    TableColumnResize,
    LinkImage,
    SelectAll,
    ShowBlocks,
    PictureEditing,
    ImageBlock,
    ImageInline,
    MediaEmbedToolbar,
  ],
  extraPlugins: [MediaUploadAdapterPlugin as never],
  toolbar: {
    items: [
      "undo", "redo",
      "|",
      "heading",
      "|",
      "bold", "italic", "underline", "strikethrough", "code",
      "|",
      "fontSize", "fontColor", "fontBackgroundColor", "highlight",
      "|",
      "alignment",
      "|",
      "bulletedList", "numberedList", "todoList", "outdent", "indent",
      "|",
      "link", "insertImage", "insertTable", "blockQuote", "codeBlock", "horizontalLine", "pageBreak", "htmlEmbed",
      "|",
      "subscript", "superscript", "specialCharacters",
      "|",
      "removeFormat", "findAndReplace",
      "|",
      "sourceEditing", "showBlocks",
    ],
    shouldNotGroupWhenFull: false,
  },
  heading: {
    options: [
      { model: "paragraph", title: "Paragraph", class: "ck-heading_paragraph" },
      { model: "heading2", view: "h2", title: "Heading 2", class: "ck-heading_heading2" },
      { model: "heading3", view: "h3", title: "Heading 3", class: "ck-heading_heading3" },
      { model: "heading4", view: "h4", title: "Heading 4", class: "ck-heading_heading4" },
    ],
  },
  image: {
    toolbar: [
      "imageStyle:block", "imageStyle:side", "|",
      "toggleImageCaption", "imageTextAlternative", "|",
      "resizeImage",
    ],
    insert: {
      type: "auto",
    },
  },
  table: {
    contentToolbar: ["tableColumn", "tableRow", "mergeTableCells", "tableProperties", "tableCellProperties"],
  },
  mediaEmbed: {
    previewsInData: true,
    providers: [
      {
        name: "youtube",
        url: /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/.+/,
      },
      {
        name: "vimeo",
        url: /^(?:https?:\/\/)?(?:www\.)?vimeo\.com\/.+/,
      },
      {
        name: "dailymotion",
        url: /^(?:https?:\/\/)?(?:www\.)?dailymotion\.com\/.+/,
      },
    ],
  },
  link: {
    addTargetToExternalLinks: true,
    defaultProtocol: "https://",
  },
  htmlSupport: {
    allow: [
      { name: "div", attributes: ["class", "id", "style"], classes: true, styles: true },
      { name: "span", attributes: ["class", "style"], classes: true, styles: true },
      { name: "p", attributes: ["class", "style"], classes: true, styles: true },
      { name: /^h[1-6]$/, attributes: ["class", "id"], classes: true },
      { name: "img", attributes: ["src", "alt", "width", "height", "loading"], classes: true, styles: true },
      { name: "a", attributes: ["href", "target", "rel", "title"], classes: true },
      { name: "figure", attributes: ["class"], classes: true, styles: true },
      { name: "figcaption", attributes: ["class"], classes: true },
      { name: "iframe", attributes: ["src", "width", "height", "frameborder", "allowfullscreen", "title"] },
      { name: "br" },
      { name: "hr", attributes: ["class"], classes: true },
    ],
    disallow: [
      { name: "script" },
      { name: "style" },
      { name: "form" },
      { name: "input" },
      { name: "textarea" },
      { name: "button" },
      { name: "object" },
      { name: "embed" },
      { name: "applet" },
    ],
  },
  placeholder: "Start writing content...",
  licenseKey: "GPL",
};

export function RichTextEditor({
  html,
  onChange,
  draftKey,
}: {
  html: string;
  onChange: (html: string) => void;
  draftKey?: string;
}) {
  const editorRef = useRef<ClassicEditor | null>(null);
  const [draftBanner, setDraftBanner] = useState<string | null>(null);

  // On mount: check for a saved draft
  useEffect(() => {
    if (!draftKey) return;
    try {
      const saved = localStorage.getItem(`ck-draft:${draftKey}`);
      if (saved && saved !== html) setDraftBanner(saved);
    } catch {
      // localStorage unavailable
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  const restoreDraft = () => {
    if (!draftBanner || !editorRef.current) return;
    editorRef.current.setData(draftBanner);
    onChange(draftBanner);
    setDraftBanner(null);
  };

  const dismissDraft = () => {
    if (draftKey) {
      try { localStorage.removeItem(`ck-draft:${draftKey}`); } catch { /* ignore */ }
    }
    setDraftBanner(null);
  };

  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.destroy().catch(() => {});
        editorRef.current = null;
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      {draftBanner && (
        <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[rgb(var(--token-warning)/0.40)] bg-[rgb(var(--token-warning)/0.08)] px-3 py-2 text-sm">
          <span className="text-[var(--color-warning)]">Unsaved draft found. Restore it?</span>
          <div className="flex gap-2">
            <button type="button" onClick={restoreDraft} className="font-semibold text-[var(--color-primary)] hover:underline">Restore</button>
            <button type="button" onClick={dismissDraft} className="text-[var(--color-muted-fg)] hover:underline">Dismiss</button>
          </div>
        </div>
      )}
      <div className="ck-theme-override rounded-[var(--radius-md)] overflow-x-auto border border-[var(--color-input)] min-w-0 w-full">
        <CKEditor
          editor={ClassicEditor}
          config={EDITOR_CONFIG}
          data={html}
          onReady={(editor) => {
            editorRef.current = editor;
          }}
          onChange={(_, editor) => {
            const data = editor.getData();
            onChange(data);
            if (draftKey) {
              try { localStorage.setItem(`ck-draft:${draftKey}`, data); } catch { /* ignore */ }
            }
          }}
        />
      </div>
    </div>
  );
}
