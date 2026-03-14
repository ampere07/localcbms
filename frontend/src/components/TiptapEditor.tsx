import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Image } from '@tiptap/extension-image';
import { Underline } from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Link } from '@tiptap/extension-link';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import { Placeholder } from '@tiptap/extension-placeholder';
import html2pdf from 'html2pdf.js';
import { Extension } from '@tiptap/core';
import { FontFamily } from '@tiptap/extension-font-family';

// Custom Font Size Extension
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: { chain: any }) => {
        return chain()
          .setMark('textStyle', { fontSize })
          .run();
      },
      unsetFontSize: () => ({ chain }: { chain: any }) => {
        return chain()
          .setMark('textStyle', { fontSize: null })
          .run();
      },
    } as any;
  },
});

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable: boolean;
  isDarkMode: boolean;
  colorPalette: any;
  templateCode: string;
  onInit: (editor: any) => void;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content,
  onChange,
  editable,
  isDarkMode,
  colorPalette,
  templateCode,
  onInit
}) => {
  const [tableDropdownOpen, setTableDropdownOpen] = useState(false);
  const [bordersDropdownOpen, setBordersDropdownOpen] = useState(false);
  const [marginDropdownOpen, setMarginDropdownOpen] = useState(false);
  const [headingDropdownOpen, setHeadingDropdownOpen] = useState(false);
  const [fontFamilyDropdownOpen, setFontFamilyDropdownOpen] = useState(false);
  const [fontSizeDropdownOpen, setFontSizeDropdownOpen] = useState(false);
  const [imageDropdownOpen, setImageDropdownOpen] = useState(false);
  
  const tableDropdownRef = useRef<HTMLDivElement>(null);
  const bordersDropdownRef = useRef<HTMLDivElement>(null);
  const marginDropdownRef = useRef<HTMLDivElement>(null);
  const headingDropdownRef = useRef<HTMLDivElement>(null);
  const fontFamilyDropdownRef = useRef<HTMLDivElement>(null);
  const fontSizeDropdownRef = useRef<HTMLDivElement>(null);
  const imageDropdownRef = useRef<HTMLDivElement>(null);

  const [pagePadding, setPagePadding] = useState('40px');
  const pagePaddingRef = useRef('40px');

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, visible: boolean } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const isSOATemplate = templateCode?.toUpperCase() === 'SOA_TEMPLATE';

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.extend({
        draggable: true,
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: '100%',
              parseHTML: element => element.getAttribute('width') || element.style.width || '100%',
              renderHTML: attributes => {
                // Only return the width attribute itself if needed, but we'll merge into style
                return { width: attributes.width };
              },
            },
            style: {
              default: null,
              parseHTML: element => element.getAttribute('style'),
              renderHTML: attributes => {
                let style = attributes.style || '';
                // Ensure width is synced into style if it's not already there
                if (attributes.width && !style.includes('width:')) {
                  style = `width: ${attributes.width}; ${style}`.trim();
                }
                if (!style) return {};
                return { style };
              },
            },
          }
        },
        // Force Tiptap to consolidate style attributes by providing a custom renderHTML
        renderHTML({ HTMLAttributes }) {
          const { style, ...rest } = HTMLAttributes;
          // Collect all potential style strings
          const styles = [];
          if (HTMLAttributes.style) styles.push(HTMLAttributes.style);
          // If Tiptap injected a second style (it shouldn't but just in case)
          // Actually, our addAttributes above will conflict. 
          // Best way: use a single attribute for all styles or handle it here.
          return ['table', HTMLAttributes, ['tbody', 0]]
        },
      }).configure({
        resizable: true,
      }),
      TableRow,
      TableHeader.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            style: {
              default: null,
              parseHTML: (element: HTMLElement) => element.getAttribute('style'),
              renderHTML: (attributes: any) => {
                if (!attributes.style) return {}
                return { style: attributes.style }
              },
            },
          }
        },
      }),
      TableCell.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            style: {
              default: null,
              parseHTML: (element: HTMLElement) => element.getAttribute('style'),
              renderHTML: (attributes: any) => {
                if (!attributes.style) return {}
                return { style: attributes.style }
              },
            },
          }
        },
      }),
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: 'auto',
              parseHTML: element => element.getAttribute('width') || element.style.width || 'auto',
              renderHTML: attributes => {
                return { width: attributes.width };
              },
            },
            height: {
              default: 'auto',
              parseHTML: element => element.getAttribute('height') || element.style.height || 'auto',
              renderHTML: attributes => {
                return { height: attributes.height };
              },
            },
            style: {
              default: null,
              parseHTML: element => element.getAttribute('style'),
              renderHTML: attributes => {
                let style = attributes.style || '';
                // Ensure width is synced into style for better rendering
                if (attributes.width && attributes.width !== 'auto' && !style.includes('width:')) {
                  style = `width: ${attributes.width}; ${style}`.trim();
                }
                if (!style) return {};
                return { style };
              },
            },
          }
        },
      }).configure({
        inline: true,
        allowBase64: true,
      }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Link.configure({
        openOnClick: false,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'Write something …',
      }),
    ],
    content: content,
    editable: editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onCreate: ({ editor }) => {
      // Attach custom methods to the editor instance directly to preserve prototype methods
      (editor as any).getPagePadding = () => pagePaddingRef.current;
      (editor as any).setPagePadding = (p: string) => { 
        setPagePadding(p); 
        pagePaddingRef.current = p; 
      };
      onInit(editor);
    },
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const refs = [tableDropdownRef, bordersDropdownRef, marginDropdownRef, headingDropdownRef, fontFamilyDropdownRef, fontSizeDropdownRef, imageDropdownRef];
      const setters = [setTableDropdownOpen, setBordersDropdownOpen, setMarginDropdownOpen, setHeadingDropdownOpen, setFontFamilyDropdownOpen, setFontSizeDropdownOpen, setImageDropdownOpen];
      
      refs.forEach((ref, index) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          setters[index](false);
        }
      });
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (editor) {
      const currentHTML = editor.getHTML();
      // Only update if the content is actually different to avoid cursor jumping
      if (content !== undefined && content !== null && currentHTML !== content) {
        editor.commands.setContent(content, { emitUpdate: false });
        
        // Try to recover page padding from content if stored in a data attribute
        const match = typeof content === 'string' ? content.match(/data-page-padding="([^"]+)"/) : null;
        if (match) {
          setPagePadding(match[1]);
          pagePaddingRef.current = match[1];
        }
      }
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  // General Purpose Resizing Logic (Tables & Images)
  useEffect(() => {
    if (!isSOATemplate) return;
    let isResizing = false;
    let resizeType: 'table' | 'image' | null = null;
    let startX = 0;
    let startWidth = 0;
    let currentElement: HTMLElement | null = null;

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const table = target.closest('table');
      const img = target.closest('img');
      const x = e.clientX;
      const y = e.clientY;

      if (table) {
        const rect = table.getBoundingClientRect();
        const isBottomRight = (x > rect.right - 30) && (y > rect.bottom - 30);
        const isTopLeftHandle = (x < rect.left + 30) && (y < rect.top && y > rect.top - 40);

        if (isBottomRight) {
           isResizing = true;
           resizeType = 'table';
           startX = x;
           startWidth = rect.width;
           currentElement = table;
           e.preventDefault();
           e.stopPropagation();
           document.body.style.cursor = 'nwse-resize';
        } else if (isTopLeftHandle && editor) {
           const pos = editor.view.posAtDOM(table, 0);
           if (pos >= 0) {
             editor.commands.setNodeSelection(pos - 1);
             setTimeout(() => { document.body.style.cursor = 'move'; }, 10);
           }
        }
      } else if (img) {
        const rect = img.getBoundingClientRect();
        const isBottomRight = (x > rect.right - 25) && (y > rect.bottom - 25);
        if (isBottomRight) {
          isResizing = true;
          resizeType = 'image';
          startX = x;
          startWidth = rect.width;
          currentElement = img;
          e.preventDefault();
          e.stopPropagation();
          document.body.style.cursor = 'nwse-resize';
        }
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing || !currentElement) return;
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(50, startWidth + deltaX);
      
      currentElement.style.width = `${newWidth}px`;
      if (resizeType === 'table') {
        currentElement.style.tableLayout = 'fixed';
      }
    };

    const onMouseUp = () => {
      if (isResizing && currentElement && editor) {
        const finalWidth = currentElement.style.width;
        const pos = editor.view.posAtDOM(currentElement, 0);
        if (pos >= 0) {
          const attrPos = resizeType === 'table' ? pos - 1 : pos;
          const nodeType = resizeType === 'table' ? 'width' : 'width'; // both use width
          editor.view.dispatch(editor.state.tr.setNodeAttribute(attrPos, 'width', finalWidth));
        }
      }
      isResizing = false;
      resizeType = null;
      currentElement = null;
      document.body.style.cursor = '';
    };

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [editor, isSOATemplate]);

  // Context Menu Logic
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('td, th')) {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, visible: true });
    } else if (target.closest('img')) {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, visible: true });
    } else {
      setContextMenu(null);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };
    if (contextMenu?.visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [contextMenu]);

  const toggleBorder = (side: string) => {
    if (!editor) return;
    
    const isHeader = editor.isActive('tableHeader');
    const type = isHeader ? 'tableHeader' : 'tableCell';
    const attributes = editor.getAttributes(type);
    let currentStyle = (attributes.style as string) || '';
    
    // Pattern to look for: border-[side]: none
    const regex = new RegExp(`border-${side}:\\s*none\\s*!important;?`, 'i');
    
    let newStyle = '';
    if (regex.test(currentStyle)) {
      // If it exists, remove it (restore border)
      newStyle = currentStyle.replace(regex, '').trim();
    } else {
      // If it doesn't exist, add it (hide border)
      newStyle = `${currentStyle} border-${side}: none !important;`.trim();
    }
    
    editor.chain().focus().updateAttributes(type, { style: newStyle }).run();
  };

  const alignTable = (align: 'left' | 'center') => {
    if (!editor) return;
    const attributes = editor.getAttributes('table');
    const currentStyle = (attributes.style as string) || '';
    
    let newStyle = currentStyle.replace(/margin-left:[^;!]+(!important)?/g, '').replace(/margin-right:[^;!]+(!important)?/g, '');
    if (align === 'center') {
      newStyle = `${newStyle} margin-left: auto !important; margin-right: auto !important;`.trim();
    } else {
      newStyle = `${newStyle} margin-left: 0 !important; margin-right: auto !important;`.trim();
    }
    
    editor.chain().focus().updateAttributes('table', { style: newStyle }).run();
  };

  const setTableSpacing = (margin: string) => {
    if (!editor) return;
    const attributes = editor.getAttributes('table');
    const currentStyle = (attributes.style as string) || '';
    
    let newStyle = currentStyle;
    if (currentStyle.match(/margin-top:\s*[^;!]+/i)) {
      newStyle = currentStyle.replace(/margin-top:[^;!]+(!important)?/i, `margin-top: ${margin} !important`);
    } else {
      newStyle = `${currentStyle} margin-top: ${margin} !important;`.trim();
    }
    
    editor.chain().focus().updateAttributes('table', { style: newStyle }).run();
  };

  const insertParagraph = (where: 'above' | 'below') => {
    if (!editor) return;
    const { selection } = editor.state;
    let tablePos = -1;
    let tableNode = null;
    
    editor.state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
      if (node.type.name === 'table') { tablePos = pos; tableNode = node; return false; }
    });

    if (tablePos === -1 || !tableNode) return;

    if (where === 'above') {
      editor.chain().focus().insertContentAt(tablePos, { type: 'paragraph' }).run();
    } else {
      editor.chain().focus().insertContentAt(tablePos + (tableNode as any).nodeSize, { type: 'paragraph' }).run();
    }
    setTableDropdownOpen(false);
  };

  const moveTable = (direction: 'up' | 'down') => {
    if (!editor) return;
    const { state, view } = editor;
    const { selection } = state;
    
    let tablePos = -1;
    let tableNode = null;
    
    state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
      if (node.type.name === 'table') {
        tablePos = pos;
        tableNode = node;
        return false;
      }
    });

    if (tablePos === -1 || !tableNode) return;

    const transaction = state.tr;
    transaction.delete(tablePos, tablePos + (tableNode as any).nodeSize);
    
    let insertPos = tablePos;
    if (direction === 'up') {
      const $pos = state.doc.resolve(tablePos);
      const prevNode = $pos.nodeBefore;
      if (prevNode) {
        insertPos = tablePos - prevNode.nodeSize;
      } else {
        return;
      }
    } else {
      const $pos = state.doc.resolve(tablePos + (tableNode as any).nodeSize);
      const nextNode = $pos.nodeAfter;
      if (nextNode) {
        insertPos = tablePos + nextNode.nodeSize;
      } else {
        return;
      }
    }
    
    // Ensure we are inserting at a valid top-level position
    transaction.insert(insertPos, tableNode);
    view.dispatch(transaction);
    
    // Focus and select the table at its new position
    setTimeout(() => {
      editor.commands.focus();
      editor.commands.setNodeSelection(insertPos);
    }, 10);
    
    setTableDropdownOpen(false);
  };

  const resizeTableToWidth = (width: string) => {
    if (!editor) return;
    editor.chain().focus().updateAttributes('table', { width }).run();
    setTableDropdownOpen(false);
  };

  const editPadding = (value: string) => {
    if (!editor) return;
    const isHeader = editor.isActive('tableHeader');
    const type = isHeader ? 'tableHeader' : 'tableCell';
    const attributes = editor.getAttributes(type);
    const currentStyle = (attributes.style as string) || '';
    
    let newStyle = currentStyle;
    if (currentStyle.match(/padding:\s*[^;!]+/i)) {
      newStyle = currentStyle.replace(/padding:[^;!]+(!important)?/i, `padding: ${value} !important`);
    } else {
      newStyle = `${currentStyle} padding: ${value} !important;`.trim();
    }
    
    editor.chain().focus().updateAttributes(type, { style: newStyle }).run();
  };

  const handlePagePaddingChange = (value: string) => {
    setPagePadding(value);
    pagePaddingRef.current = value;
  };

  const setCellColor = (color: string, customChain?: any) => {
    if (!editor) return;
    const type = editor.isActive('tableHeader') ? 'tableHeader' : 'tableCell';
    const attributes = editor.getAttributes(type);
    const currentStyle = (attributes.style as string) || '';
    
    // Clean up existing background-color from style string
    let newStyle = currentStyle.replace(/background-color:[^;!]+(!important)?/gi, '').trim();
    if (color && color !== 'transparent') {
      newStyle = (newStyle ? newStyle + ' ' : '') + `background-color: ${color} !important;`;
    }
    
    const chain = customChain || editor.chain().focus();
    chain.setCellAttribute('style', newStyle).run();
  };

  const setColumnColor = (color: string) => {
    if (!editor) return;
    const chain = (editor.chain().focus() as any).selectColumn();
    setCellColor(color, chain);
  };

  const setRowColor = (color: string) => {
    if (!editor) return;
    const chain = (editor.chain().focus() as any).selectRow();
    setCellColor(color, chain);
  };

  const addImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      if (input.files?.length) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string' && editor) {
            editor.chain().focus().setImage({ src: reader.result }).run();
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const resizeImage = () => {
    if (!editor || !editor.isActive('image')) return;
    const attributes = editor.getAttributes('image');
    const currentWidth = attributes.width || 'auto';
    const newValue = window.prompt('Enter Image Width (e.g. 100%, 300px, auto):', currentWidth);
    if (newValue !== null) {
      editor.chain().focus().updateAttributes('image', { width: newValue }).run();
    }
  };

  const alignImage = (align: 'left' | 'center' | 'right') => {
    if (!editor || !editor.isActive('image')) return;
    let style = '';
    if (align === 'center') {
      style = 'display: block; margin-left: auto; margin-right: auto;';
    } else if (align === 'right') {
      style = 'display: block; margin-left: auto; margin-right: 0;';
    } else {
      style = 'display: block; margin-left: 0; margin-right: auto;';
    }
    editor.chain().focus().updateAttributes('image', { style }).run();
  };

  const downloadPdf = useCallback(() => {
    if (!editor) return;

    const htmlContent = editor.getHTML();
    const container = document.createElement('div');
    container.innerHTML = htmlContent;

    // Apply styles for PDF
    container.style.cssText = `
      font-family: Helvetica, Arial, sans-serif;
      font-size: 10pt;
      width: 210mm;
      padding: ${pagePadding};
      margin: 0;
      background-color: #fff;
      color: #000;
      box-sizing: border-box;
    `;

    const style = document.createElement('style');
    style.textContent = `
      table { width: 100%; border-collapse: collapse; border-spacing: 0; }
      td, th { padding: 4px; vertical-align: top; border: 1px solid #000; }
      p { margin: 0 0 8px 0; }
      img { max-width: 100%; height: auto; display: block; }
    `;
    container.prepend(style);
    document.body.appendChild(container);

    const opt = {
      margin: 0,
      filename: `${templateCode || 'email_template'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    html2pdf().set(opt).from(container).save().then(() => {
      document.body.removeChild(container);
    }).catch((err: any) => {
      console.error('PDF generation error:', err);
      document.body.removeChild(container);
    });
  }, [editor, templateCode]);

  if (!editor) {
    return null;
  }

  const primaryColor = colorPalette?.primary || '#7c3aed';
  const isTableCellActive = editor.isActive('tableCell') || editor.isActive('tableHeader');

  const fonts = [
    { label: 'Arial', value: 'Arial' },
    { label: 'Helvetica', value: 'Helvetica' },
    { label: 'Times New Roman', value: 'Times New Roman' },
    { label: 'Courier New', value: 'Courier New' },
    { label: 'Georgia', value: 'Georgia' },
    { label: 'Verdana', value: 'Verdana' },
  ];

  const fontSizes = ['8pt', '9pt', '10pt', '11pt', '12pt', '14pt', '18pt', '24pt', '36pt'];

  return (
    <div className={`tiptap-editor-container border rounded-md overflow-hidden ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'}`}>
      {editable && (
        <div className={`toolbar flex flex-wrap gap-0.5 p-1 border-b ${isDarkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-gray-50'}`}>
          {/* History */}
          <div className="flex items-center gap-0.5 px-1 border-r border-gray-300 mr-1">
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className={`p-1.5 rounded hover:bg-opacity-20 ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 disabled:opacity-30' : 'text-gray-600 hover:bg-gray-200 disabled:opacity-30'}`}
              title="Undo"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 14L4 9l5-5"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className={`p-1.5 rounded hover:bg-opacity-20 ${isDarkMode ? 'text-gray-300 hover:bg-gray-700 disabled:opacity-30' : 'text-gray-600 hover:bg-gray-200 disabled:opacity-30'}`}
              title="Redo"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 14l5-5-5-5"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>
            </button>
          </div>

          {/* Heading Dropdown */}
          <div className="relative mr-1" ref={headingDropdownRef}>
            <button
              onClick={() => setHeadingDropdownOpen(!headingDropdownOpen)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded text-sm transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              {editor.isActive('heading', { level: 1 }) ? 'H1' : 
               editor.isActive('heading', { level: 2 }) ? 'H2' : 
               editor.isActive('heading', { level: 3 }) ? 'H3' : 'Normal'}
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {headingDropdownOpen && (
              <div className={`absolute top-full left-0 mt-1 z-50 min-w-[120px] border shadow-lg rounded-md overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                <button onClick={() => { editor.chain().focus().setParagraph().run(); setHeadingDropdownOpen(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Normal</button>
                <button onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setHeadingDropdownOpen(false); }} className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-700 text-xl">Heading 1</button>
                <button onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setHeadingDropdownOpen(false); }} className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-700 text-lg">Heading 2</button>
                <button onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); setHeadingDropdownOpen(false); }} className="w-full px-4 py-2 text-left text-sm font-bold hover:bg-gray-100 dark:hover:bg-gray-700 text-base">Heading 3</button>
              </div>
            )}
          </div>

          {/* Font Family Dropdown */}
          <div className="relative mr-1" ref={fontFamilyDropdownRef}>
            <button
              onClick={() => setFontFamilyDropdownOpen(!fontFamilyDropdownOpen)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded text-sm transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              {fonts.find(f => editor.getAttributes('textStyle').fontFamily === f.value)?.label || 'Font'}
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {fontFamilyDropdownOpen && (
              <div className={`absolute top-full left-0 mt-1 z-50 min-w-[150px] border shadow-lg rounded-md overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                {fonts.map(font => (
                  <button 
                    key={font.value} 
                    onClick={() => { editor.chain().focus().setFontFamily(font.value).run(); setFontFamilyDropdownOpen(false); }} 
                    style={{ fontFamily: font.value }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Font Size Dropdown */}
          <div className="relative mr-1" ref={fontSizeDropdownRef}>
            <button
              onClick={() => setFontSizeDropdownOpen(!fontSizeDropdownOpen)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded text-sm transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
            >
              {editor.getAttributes('textStyle').fontSize || '10pt'}
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {fontSizeDropdownOpen && (
              <div className={`absolute top-full left-0 mt-1 z-50 min-w-[80px] border shadow-lg rounded-md overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                {fontSizes.map(size => (
                  <button 
                    key={size} 
                    onClick={() => { (editor.chain().focus() as any).setFontSize(size).run(); setFontSizeDropdownOpen(false); }} 
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-300 mx-1 my-auto mr-1"></div>

          {/* Basic Formatting */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-opacity-20 ${editor.isActive('bold') ? 'bg-indigo-500 text-white' : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
            title="Bold"
          >
            <b>B</b>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-opacity-20 ${editor.isActive('italic') ? 'bg-indigo-500 text-white' : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
            title="Italic"
          >
            <i>I</i>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded hover:bg-opacity-20 ${editor.isActive('underline') ? 'bg-indigo-500 text-white' : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
            title="Underline"
          >
            <u>U</u>
          </button>
          
          <input
            type="color"
            onInput={(event: any) => editor.chain().focus().setColor(event.target.value).run()}
            value={editor.getAttributes('textStyle').color || '#000000'}
            className="w-8 h-8 p-1 rounded cursor-pointer bg-transparent"
            title="Text Color"
          />

          <div className="w-px h-6 bg-gray-300 mx-1 my-auto mr-1"></div>

          {/* Alignment */}
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-1.5 rounded hover:bg-opacity-20 ${editor.isActive({ textAlign: 'left' }) ? 'bg-indigo-500 text-white' : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
            title="Align Left"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-1.5 rounded hover:bg-opacity-20 ${editor.isActive({ textAlign: 'center' }) ? 'bg-indigo-500 text-white' : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
            title="Align Center"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-1.5 rounded hover:bg-opacity-20 ${editor.isActive({ textAlign: 'right' }) ? 'bg-indigo-500 text-white' : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
            title="Align Right"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-1.5 rounded hover:bg-opacity-20 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-indigo-500 text-white' : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
            title="Justify"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1 my-auto mr-1"></div>

            {/* Case/Lists */}
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded hover:bg-opacity-20 ${editor.isActive('bulletList') ? 'bg-indigo-500 text-white' : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
              title="Bullet List"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-1.5 rounded hover:bg-opacity-20 ${editor.isActive('orderedList') ? 'bg-indigo-500 text-white' : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
              title="Ordered List"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><polyline points="4 6 5 5 5 7"/><path d="M4 13c.8 0 1.5.5 1.5 1.2s-.7 1.2-1.5 1.2c-.4 0-.7-.1-1-.3"/><path d="M4 19c.8 0 1.5.5 1.5 1.2s-.7 1.2-1.5 1.2c-.4 0-.7-.1-1-.3"/></svg>
            </button>

            <button
              onClick={addImage}
              className={`p-1.5 rounded hover:bg-opacity-20 ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
              title="Upload Image"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </button>

            <button
              onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
              className={`p-1.5 rounded hover:bg-opacity-20 ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
              title="Clear Formatting"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.5 19L9 7H4l3 10v9h2v-9l6-9h5l-4.5 9.5"/><path d="M22 2L2 22"/></svg>
            </button>

            {/* Image Selection / Controls */}
            {editor.isActive('image') && (
              <div className="relative mr-1" ref={imageDropdownRef}>
                <button
                  onClick={() => {
                    setImageDropdownOpen(!imageDropdownOpen);
                    setTableDropdownOpen(false);
                    setBordersDropdownOpen(false);
                    setMarginDropdownOpen(false);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded text-sm transition-all bg-indigo-500 text-white shadow-md hover:bg-indigo-600"
                >
                  Image
                  <svg className={`w-3 h-3 transition-transform ${imageDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {imageDropdownOpen && (
                  <div className={`absolute top-full left-0 mt-1 z-50 min-w-[140px] border shadow-lg rounded-md overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                     <div className="flex flex-col p-1">
                        {isSOATemplate && (
                          <>
                            <button onClick={() => { resizeImage(); setImageDropdownOpen(false); }} className={`px-4 py-2 text-left text-sm hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Resize Image...</button>
                            <div className={`h-px my-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                            <button onClick={() => { alignImage('left'); setImageDropdownOpen(false); }} className={`px-4 py-2 text-left text-sm hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-700'} flex items-center justify-between`}>Align Left <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg></button>
                            <button onClick={() => { alignImage('center'); setImageDropdownOpen(false); }} className={`px-4 py-2 text-left text-sm hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-700'} flex items-center justify-between`}>Align Center <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg></button>
                            <button onClick={() => { alignImage('right'); setImageDropdownOpen(false); }} className={`px-4 py-2 text-left text-sm hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-700'} flex items-center justify-between`}>Align Right <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg></button>
                            <div className={`h-px my-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                          </>
                        )}
                        <button onClick={() => { editor.chain().focus().deleteSelection().run(); setImageDropdownOpen(false); }} className={`px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 ${isDarkMode ? 'hover:bg-red-900/20' : ''}`}>Remove Image</button>
                     </div>
                  </div>
                )}
              </div>
            )}

          <div className="w-px h-6 bg-gray-300 mx-1 my-auto mr-1"></div>
          
          {/* Table Dropdown */}
          <div className="relative mr-1" ref={tableDropdownRef}>
            <button
              onClick={() => {
                setTableDropdownOpen(!tableDropdownOpen);
                setBordersDropdownOpen(false);
                setHeadingDropdownOpen(false);
                setFontFamilyDropdownOpen(false);
                setFontSizeDropdownOpen(false);
              }}
              className={`flex items-center gap-1 px-2 py-1.5 rounded text-sm transition-colors ${
                tableDropdownOpen || editor.isActive('table')
                  ? 'bg-indigo-500 text-white'
                  : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Table
              <svg className={`w-3 h-3 transition-transform ${tableDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            
            {tableDropdownOpen && (
              <div className={`absolute top-full left-0 mt-1 z-50 min-w-[160px] border shadow-lg rounded-md overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                <div className="flex flex-col">
                  <button onClick={() => { editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); setTableDropdownOpen(false); }} className={`px-4 py-2 text-left text-sm hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Insert Table</button>
                  <div className={`h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  <button onClick={() => { editor.chain().focus().addColumnBefore().run(); setTableDropdownOpen(false); }} className={`px-4 py-2 text-left text-sm hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Add Column Before</button>
                  <button onClick={() => { editor.chain().focus().addColumnAfter().run(); setTableDropdownOpen(false); }} className={`px-4 py-2 text-left text-sm hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Add Column After</button>
                  <button onClick={() => { editor.chain().focus().deleteColumn().run(); setTableDropdownOpen(false); }} className={`px-4 py-2 text-left text-sm hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Delete Column</button>
                  <div className={`h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  <button onClick={() => { editor.chain().focus().addRowBefore().run(); setTableDropdownOpen(false); }} className={`px-4 py-2 text-left text-sm hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Add Row Before</button>
                  <button onClick={() => { editor.chain().focus().addRowAfter().run(); setTableDropdownOpen(false); }} className={`px-4 py-2 text-left text-sm hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Add Row After</button>
                  <button onClick={() => { editor.chain().focus().deleteRow().run(); setTableDropdownOpen(false); }} className={`px-4 py-2 text-left text-sm hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Delete Row</button>
                  <div className={`h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  <button onClick={() => { editor.chain().focus().mergeCells().run(); setTableDropdownOpen(false); }} className={`px-4 py-2 text-left text-sm hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Merge Cells</button>
                  <button onClick={() => { editor.chain().focus().splitCell().run(); setTableDropdownOpen(false); }} className={`px-4 py-2 text-left text-sm hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Split Cell</button>
                  <div className={`h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                   {/* Precise Moving & Spacing */}
                  {isSOATemplate && (
                    <>
                      <div className={`px-4 py-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Precise Move (Spacing)</label>
                        <div className="flex gap-1 mb-2">
                           {['0px', '20px', '40px', '100px'].map(s => (
                             <button key={s} onClick={() => setTableSpacing(s)} className="flex-1 py-1 text-[10px] border rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:border-gray-600 dark:text-gray-300">{s}</button>
                           ))}
                        </div>
                        <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Width & Alignment</label>
                        <div className="flex gap-1 mb-2">
                           {['50%', '75%', '100%'].map(w => (
                             <button key={w} onClick={() => resizeTableToWidth(w)} className="flex-1 py-1 text-[10px] border rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:border-gray-600 dark:text-gray-300">{w}</button>
                           ))}
                           <input 
                             type="text" 
                             placeholder="e.g. 300px"
                             className={`w-16 px-1 py-1 text-[10px] border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                             onKeyDown={(e) => {
                               if (e.key === 'Enter') {
                                 resizeTableToWidth((e.target as HTMLInputElement).value);
                               }
                             }}
                           />
                        </div>
                        <div className="flex gap-1">
                           <button onClick={() => alignTable('left')} className="flex-1 py-1 text-[10px] border rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:border-gray-600 dark:text-gray-300">Left</button>
                           <button onClick={() => alignTable('center')} className="flex-1 py-1 text-[10px] border rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/40 dark:border-gray-600 dark:text-gray-300">Center</button>
                        </div>

                        <label className="block text-[10px] uppercase font-semibold text-gray-500 mt-2 mb-1">Column/Row Color</label>
                        <div className="flex items-center gap-1">
                          <input 
                            type="color"
                            onInput={(e: any) => setColumnColor(e.target.value)}
                            className="w-10 h-6 p-0 border-0 bg-transparent cursor-pointer"
                            title="Set Column Color"
                          />
                          <button onClick={() => setColumnColor('')} className="text-[9px] px-2 py-1 border rounded hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600">Clear</button>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <input 
                            type="color"
                            onInput={(e: any) => setRowColor(e.target.value)}
                            className="w-10 h-6 p-0 border-0 bg-transparent cursor-pointer"
                            title="Set Row Color"
                          />
                          <button onClick={() => setRowColor('')} className="text-[9px] px-2 py-1 border rounded hover:bg-gray-100 dark:bg-gray-700 dark:border-gray-600">Clear</button>
                        </div>
                      </div>

                      <button onClick={() => insertParagraph('above')} className={`px-4 py-2 text-left text-sm hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Insert Space Above</button>
                      <button onClick={() => insertParagraph('below')} className={`px-4 py-2 text-left text-sm hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Insert Space Below</button>
                      <button onClick={() => moveTable('up')} className={`px-4 py-2 text-left text-sm hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Move Table Up</button>
                      <button onClick={() => moveTable('down')} className={`px-4 py-2 text-left text-sm hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Move Table Down</button>
                      <div className={`h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    </>
                  )}
  
                  <button onClick={() => { editor.chain().focus().deleteTable().run(); setTableDropdownOpen(false); }} className={`px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 ${isDarkMode ? 'hover:bg-red-900/20' : ''}`}>Delete Table</button>
                </div>
              </div>
            )}
          </div>

          {/* Borders / Cell Dropdown */}
          {isTableCellActive && (
            <div className="relative mr-1" ref={bordersDropdownRef}>
              <button
                onClick={() => {
                  setBordersDropdownOpen(!bordersDropdownOpen);
                  setTableDropdownOpen(false);
                  setMarginDropdownOpen(false);
                  setHeadingDropdownOpen(false);
                  setFontFamilyDropdownOpen(false);
                  setFontSizeDropdownOpen(false);
                }}
                className={`flex items-center gap-1 px-2 py-1.5 rounded text-sm transition-colors ${
                  bordersDropdownOpen
                    ? 'bg-indigo-500 text-white'
                    : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Cell Props
                <svg className={`w-3 h-3 transition-transform ${bordersDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              
              {bordersDropdownOpen && (
                <div className={`absolute top-full left-0 mt-1 z-50 min-w-[140px] border shadow-lg rounded-md overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                  <div className="flex flex-col">
                    <button onClick={() => toggleBorder('top')} className={`px-4 py-2 text-left text-sm hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Toggle Top</button>
                    <button onClick={() => toggleBorder('bottom')} className={`px-4 py-2 text-left text-sm hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Toggle Bottom</button>
                    <button onClick={() => toggleBorder('left')} className={`px-4 py-2 text-left text-sm hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Toggle Left</button>
                    <button onClick={() => toggleBorder('right')} className={`px-4 py-2 text-left text-sm hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-700'}`}>Toggle Right</button>
                    <div className={`h-px ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    <button 
                      onClick={() => {
                        const type = editor.isActive('tableHeader') ? 'tableHeader' : 'tableCell';
                        const attributes = editor.getAttributes(type);
                        const currentStyle = (attributes.style as string) || '';
                        const newStyle = currentStyle.includes('border: none') ? '' : 'border: none !important;';
                        editor.chain().focus().updateAttributes(type, { style: newStyle }).run();
                      }}
                      className={`px-4 py-2 text-left text-sm hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-700'}`}
                    >
                      Hide All
                    </button>
                    {/* Inline Cell Padding Input */}
                    <div className={`px-4 py-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Cell Padding</label>
                      <input 
                        type="text"
                        defaultValue={(editor.getAttributes(editor.isActive('tableHeader') ? 'tableHeader' : 'tableCell').style as string || '').match(/padding:\s*([^;!]+)/i)?.[1].trim() || '4px'}
                        onBlur={(e) => editPadding(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { editPadding(e.currentTarget.value); } }}
                        className={`w-full px-2 py-1 text-xs border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                        placeholder="e.g. 10px"
                      />
                    </div>
                    {/* Cell Background Color */}
                    <div className={`px-4 py-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <label className="block text-[10px] uppercase font-semibold text-gray-500 mb-1">Cell Background</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color"
                          onInput={(e: any) => setCellColor(e.target.value)}
                          className="w-8 h-8 p-0 border-0 bg-transparent cursor-pointer"
                          title="Choose Cell Background"
                        />
                        <button 
                          onClick={() => setCellColor('')}
                          className={`text-[10px] px-2 py-1 border rounded hover:bg-gray-100 ${isDarkMode ? 'border-gray-600 text-gray-400 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                        >
                          Transparent
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Page Margin Dropdown */}
          <div className="relative mr-1" ref={marginDropdownRef}>
            <button
              onClick={() => {
                setMarginDropdownOpen(!marginDropdownOpen);
                setTableDropdownOpen(false);
                setBordersDropdownOpen(false);
                setHeadingDropdownOpen(false);
                setFontFamilyDropdownOpen(false);
                setFontSizeDropdownOpen(false);
              }}
              className={`flex items-center gap-1 px-2 py-1.5 rounded text-sm transition-colors ${
                marginDropdownOpen
                  ? 'bg-indigo-500 text-white'
                  : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              Margin
              <svg className={`w-3 h-3 transition-transform ${marginDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            
            {marginDropdownOpen && (
              <div className={`absolute top-full left-0 mt-1 z-50 min-w-[160px] border shadow-lg rounded-md overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
                <div className="p-3 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase">Page Margin</label>
                    <input 
                      type="text"
                      value={pagePadding}
                      onChange={(e) => handlePagePaddingChange(e.target.value)}
                      className={`w-full px-2 py-1.5 text-sm border rounded ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                      placeholder="e.g. 40px"
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {['0px', '20px', '40px', '1in'].map(preset => (
                      <button 
                        key={preset}
                        onClick={() => handlePagePaddingChange(preset)}
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                          pagePadding === preset 
                            ? 'bg-indigo-500 text-white border-indigo-500' 
                            : isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {preset === '1in' ? '1 inch' : preset}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-500 leading-tight">Apply to the entire paper. Supports px, in, mm, cm.</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex-grow"></div>

          <button
            onClick={downloadPdf}
            className={`p-1.5 rounded hover:bg-opacity-20 ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-200'}`}
            title="Download PDF"
          >
            PDF
          </button>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu?.visible && (
        <div 
          ref={contextMenuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className={`fixed z-[100] min-w-[200px] shadow-2xl rounded-lg border overflow-hidden animate-in fade-in zoom-in duration-100 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}
        >
          <div className="p-1">
            {/* Image Specific Context Menu */}
            {editor.isActive('image') ? (
              <>
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-gray-400 border-b border-gray-700/50 mb-1">Image Tools</div>
                {isSOATemplate && (
                  <>
                    <button onClick={() => { resizeImage(); setContextMenu(null); }} className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2`}>Resize Image...</button>
                    <div className="flex gap-1 p-2">
                      <button onClick={() => { alignImage('left'); setContextMenu(null); }} className="flex-1 py-1 text-[10px] border rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/40 dark:border-gray-600">Left</button>
                      <button onClick={() => { alignImage('center'); setContextMenu(null); }} className="flex-1 py-1 text-[10px] border rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/40 dark:border-gray-600">Center</button>
                      <button onClick={() => { alignImage('right'); setContextMenu(null); }} className="flex-1 py-1 text-[10px] border rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/40 dark:border-gray-600">Right</button>
                    </div>
                    <div className={`h-px my-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}></div>
                  </>
                )}
                <button onClick={() => { editor.chain().focus().deleteSelection().run(); setContextMenu(null); }} className={`w-full px-3 py-1.5 text-left text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`}>Remove Image</button>
              </>
            ) : (
              /* Table Specific Context Menu (Previous Logic) */
              <>
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-gray-400 border-b border-gray-700/50 mb-1">Cell Background</div>
                <div className="grid grid-cols-5 gap-1 p-2">
                  {['#ffffff', '#f3f4f6', '#fee2e2', '#fef3c7', '#dcfce7', '#dbeafe', '#ede9fe', '#fae8ff', '#000000', 'transparent'].map(c => (
                    <button 
                      key={c} 
                      onClick={() => { setCellColor(c === 'transparent' ? '' : c); setContextMenu(null); }}
                      style={{ backgroundColor: c === 'transparent' ? 'white' : c }}
                      className={`w-5 h-5 rounded border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} hover:scale-110 transition-transform ${c === 'transparent' ? 'relative overflow-hidden' : ''}`}
                      title={c}
                    >
                      {c === 'transparent' && <div className="absolute inset-0 bg-red-500/20 rotate-45 h-px top-1/2 -translate-y-1/2"></div>}
                    </button>
                  ))}
                  <div className="col-span-1 flex items-center justify-center">
                    <input 
                      type="color" 
                      onInput={(e: any) => setCellColor(e.target.value)}
                      className="w-5 h-5 p-0 border-0 bg-transparent cursor-pointer"
                    />
                  </div>
                </div>
                
                <div className={`h-px my-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}></div>
                
                <button onClick={() => { setRowColor(''); setContextMenu(null); }} className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2`}><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="9" width="18" height="6" rx="2"/></svg> Clear Row Color</button>
                <button onClick={() => { setColumnColor(''); setContextMenu(null); }} className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2`}><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="3" width="6" height="18" rx="2"/></svg> Clear Column Color</button>
                
                <div className={`h-px my-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}></div>
                
                <button onClick={() => { editor.chain().focus().addRowAfter().run(); setContextMenu(null); }} className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700`}>Add Row After</button>
                <button onClick={() => { editor.chain().focus().addColumnAfter().run(); setContextMenu(null); }} className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700`}>Add Column After</button>
                <button onClick={() => { editor.chain().focus().mergeCells().run(); setContextMenu(null); }} className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 dark:hover:bg-gray-700`}>Merge Cells</button>
                
                {isSOATemplate && (
                  <>
                    <div className={`h-px my-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}></div>

                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-gray-400 mb-1">Align Table</div>
                    <div className="flex gap-1 p-2">
                      <button onClick={() => { alignTable('left'); setContextMenu(null); }} className="flex-1 py-1 text-[10px] border rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/40 dark:border-gray-600">Left</button>
                      <button onClick={() => { alignTable('center'); setContextMenu(null); }} className="flex-1 py-1 text-[10px] border rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/40 dark:border-gray-600">Center</button>
                    </div>

                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-gray-400 mb-1">Table Spacing</div>
                    <div className="grid grid-cols-2 gap-1 p-2">
                      {['0px', '20px', '40px', '100px'].map(s => (
                        <button key={s} onClick={() => { setTableSpacing(s); setContextMenu(null); }} className="py-1 text-[9px] border rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/40 dark:border-gray-600">{s}</button>
                      ))}
                    </div>
                  </>
                )}
                
                <div className={`h-px my-1 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}></div>
                
                <button onClick={() => { editor.chain().focus().deleteTable().run(); setContextMenu(null); }} className={`w-full px-3 py-1.5 text-left text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`}>Delete Table</button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="prose-container p-4 min-h-[400px]" onContextMenu={handleContextMenu}>
        <style>{`
          .tiptap {
            outline: none !important;
          }
          .tiptap table {
            border-collapse: collapse;
            table-layout: fixed;
            width: 100%;
            min-width: 100px;
            margin: 12px 0;
            overflow: visible;
            position: relative;
            transition: box-shadow 0.2s;
          }
          /* Non-resizable borders cursor */
          .tiptap table:hover {
            box-shadow: 0 0 0 1px ${isDarkMode ? '#4f46e5' : '#818cf8'};
          }
          .tiptap td, .tiptap th {
            min-width: 1em;
            border: 1px solid ${isDarkMode ? '#4b5563' : '#d1d5db'};
            padding: 3px 5px;
            vertical-align: top;
            box-sizing: border-box;
            position: relative;
            cursor: text;
          }
          .tiptap td:hover, .tiptap th:hover {
            /* Restore default behavior for resizable tables */
          }
          .tiptap td.selectedCell, .tiptap th.selectedCell {
            background-color: ${isDarkMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)'};
          }
          
          /* Corner "Move" Handle Visual */
          .tiptap table::before {
            content: '☩ Click to select table';
            position: absolute;
            top: -24px;
            left: 0;
            padding: 2px 8px;
            background-color: #6366f1;
            color: white;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            font-weight: bold;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 50;
            white-space: nowrap;
          }
          .tiptap table:hover::before {
            opacity: 1;
          }
          .tiptap table.ProseMirror-selectednode {
            outline: 2px solid #6366f1;
            box-shadow: 0 0 10px rgba(99, 102, 241, 0.2);
          }
          
          /* Real-time Resize Handle for Table Corner - Only for SOA */
          ${isSOATemplate ? `
          .tiptap table::after {
            content: '';
            position: absolute;
            bottom: 0;
            right: 0;
            width: 12px;
            height: 12px;
            background-image: linear-gradient(135deg, transparent 50%, #6366f1 50%, #6366f1 60%, transparent 60%, transparent 70%, #6366f1 70%);
            cursor: nwse-resize;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 60;
            pointer-events: auto;
          }
          .tiptap table:hover::after, .tiptap table.ProseMirror-selectednode::after {
            opacity: 1;
          }
          ` : ''}

          .tiptap th {
            font-weight: bold;
            text-align: left;
            background-color: ${isDarkMode ? '#374151' : '#f3f4f6'};
          }
          .tiptap img {
            max-width: 100%;
            height: auto;
            cursor: move;
            transition: outline 0.2s;
            display: inline-block;
            position: relative;
          }
          .tiptap img:hover {
            outline: 2px solid #6366f1;
            cursor: move;
          }
          .tiptap img.ProseMirror-selectednode {
            outline: 3px solid #6366f1;
            outline-offset: 2px;
          }
          /* Custom Resize Handle for Images */
          .tiptap .ProseMirror-selectednode[src] {
            cursor: nwse-resize;
          }
          .tiptap img:hover {
             /* Dynamic handles on images are usually hard without wrappers, 
                so we use the corner detection logic in JS and show cursor */
          }
          .tiptap p {
            margin: 0 0 8px 0;
          }
          .tiptap-editor-container .ProseMirror {
            font-family: Helvetica, Arial, sans-serif;
            font-size: 10pt;
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            padding: ${pagePadding};
            background-color: #fff;
            color: #000;
            box-shadow: 0 0 15px rgba(0,0,0,0.1);
          }
          .tiptap-editor-container {
             background-color: ${isDarkMode ? '#1f2937' : '#f9fafb'};
             padding: 20px;
             display: flex;
             flex-direction: column;
             align-items: center;
          }
          /* Dark mode specific for the editor content area if we want it to stay white like paper */
          .tiptap-editor-container .ProseMirror {
            background-color: white !important;
            color: black !important;
          }
        `}</style>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TiptapEditor;
