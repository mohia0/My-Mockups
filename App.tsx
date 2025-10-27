import React, { useState, useCallback, useRef, useEffect } from 'react';
import { generateFinalMockup, rewriteDescription, generateImageBasedMockup, inpaintImage } from './services/geminiService';
import { Header } from './components/Header';
import { ErrorDisplay } from './components/ErrorDisplay';
import { Spinner } from './components/Spinner';
import { BrushIcon, ChevronDownIcon, DownloadIcon, ExpandIcon, ImageIcon, LandscapeIcon, PlusCircleIcon, PortraitIcon, RefreshIcon, SparklesIcon, SquareIcon, TextIcon, UndoIcon, UploadIcon, WandIcon, XIcon } from './components/icons';

const businessCategories = {
    'Restaurant & Cafe': {
        description: "The aesthetic should evoke feelings of warmth, appetite, and community. Use natural lighting, delicious-looking food, and inviting interior settings. For cafes, think cozy and artisanal. For restaurants, it can range from rustic and casual to elegant and fine-dining.",
        prompts: [
            "Macro shot of a logo on a ceramic coffee mug, steam gently rising, with a blurred, cozy cafe interior in the background.",
            "Flat lay of a menu with the logo debossed on its leather cover, placed on a dark slate surface next to a glass of red wine.",
            "A logo printed on a pizza box, shot from above, sitting on a kitchen counter with fresh ingredients like basil and tomatoes scattered around.",
            "Close-up of a logo embroidered on a black barista apron, with the person's hands preparing a latte in the background.",
            "A logo on a glass of craft beer with condensation, shot with a shallow depth of field against the warm, ambient light of a brewery.",
            "The logo printed on a paper food container for takeout, held by a person sitting on a park bench in the afternoon sun.",
            "A restaurant's logo etched onto a steak knife resting on a rustic wooden table, with a perfectly cooked steak slightly out of focus.",
            "Low-angle shot of a neon sign featuring the logo, glowing against a dark brick wall on a rainy city night.",
        ]
    },
    'Tech & SaaS': {
        description: "The aesthetic must be clean, modern, and professional. Use imagery related to technology like laptops, smartphones, and abstract data visualizations. The mood should be innovative, efficient, and trustworthy. Minimalist settings and cool color palettes often work well.",
        prompts: [
            "Close-up of a logo on a laptop screen, with the keyboard and a user's hands slightly blurred in the foreground in a sleek, minimalist office.",
            "A vibrant logo sticker on the back of a laptop, seen over the shoulder of a developer at a hackathon with the energetic glow of monitors.",
            "Logo displayed on a smartphone screen, held up to scan a QR code, with a clean, modern retail environment in the background.",
            "The logo projected onto a large screen during a tech conference keynote speech, with the speaker silhouetted in the foreground.",
            "A logo on a server rack in a data center, with blue and green LED lights creating a futuristic, high-tech atmosphere.",
            "An employee's ID card with the logo, worn on a lanyard in a bright, modern corporate campus hallway.",
            "Flat lay of a tablet showing the logo on screen, next to a stylus and a notebook on a clean white desk. Top-down, studio lighting.",
            "The logo subtly integrated into the UI of a futuristic heads-up display, seen from a first-person perspective.",
        ]
    },
    'Fashion & Apparel': {
        description: "The aesthetic should be stylish and aspirational. Focus on textures, fabrics, and the human form. Lighting should be flattering. The context can range from high-fashion editorial to casual streetwear. The logo should be presented as a premium brand element.",
        prompts: [
            "Detailed close-up of a logo embroidered on the pocket of a premium denim jacket, with the fabric's texture highly visible against an urban brick wall.",
            "A luxury shopping bag with the logo in gold foil, held by a stylish person on a chic European city street with beautiful bokeh.",
            "The logo embossed on a leather patch on the back of a pair of high-end jeans. Shot with dramatic, shadowy lighting.",
            "A logo on the temple of a pair of sunglasses being worn by a model on a sun-drenched beach. The ocean is in the background.",
            "Close-up on the clasp of a designer handbag, where the logo is intricately engraved. The lighting is soft and luxurious.",
            "A logo printed on the chest of a hoodie, captured in a candid, high-energy street style photo in a city like Tokyo or New York.",
            "The logo on the sole of a sneaker, stepping into a puddle, creating a dynamic reflection. Shot from a very low angle.",
            "A woven label with the logo on the inside of a tailored wool coat. The shot is a macro detail, emphasizing quality and craftsmanship.",
        ]
    },
    'Health & Wellness': {
        description: "The aesthetic should feel calming, clean, and positive. Use natural elements, soft lighting, and serene environments. Imagery of nature, yoga, healthy food, or self-care products is appropriate. The mood should be rejuvenating and trustworthy.",
        prompts: [
            "Low-angle shot of a logo on a frosted glass water bottle with condensation, sitting on a wooden floor next to a yoga mat in a sunlit studio.",
            "Top-down flat lay of a logo on a cosmetic jar, surrounded by natural ingredients like lavender sprigs on a white marble surface.",
            "The logo on the packaging of an organic tea box, placed on a rustic wooden table with a steaming cup of tea nearby. Soft morning light.",
            "A logo on the side of a reusable canvas tote bag filled with fresh produce from a farmer's market. Bright, natural lighting.",
            "Close-up of a logo on a bottle of essential oil, held in a person's hands. The background is a serene, out-of-focus natural landscape.",
            "The logo printed on a scented candle, with the flame lit, creating a warm and relaxing glow in a dimly lit, spa-like room.",
            "A fitness tracker on someone's wrist, with the logo displayed on the screen as they are on a mountain trail run at sunrise.",
            "The logo on the cover of a journal or planner, placed next to a succulent plant on a clean, organized desk.",
        ]
    },
    'Finance & Insurance': {
        description: "The aesthetic must convey trust, security, and professionalism. Use clean lines, organized environments, and a corporate color palette (blues, grays). Imagery of people in business settings, documents, or abstract symbols of growth and protection is effective.",
        prompts: [
            "A business card with the logo, resting against a laptop on a polished mahogany desk in a high-rise office with a blurred city skyline.",
            "The logo subtly etched onto the glass wall of a modern, secure boardroom, shot from a low angle to convey strength and stability.",
            "Close-up of a high-quality corporate pen with the logo engraved on its clip, lying on top of a signed contract document.",
            "A logo on the screen of a tablet displaying stock market data, with the trader's hands in motion in a fast-paced trading floor environment.",
            "The logo on the cover of an annual report, placed on a table in a bright, modern office lobby. The lighting is clean and professional.",
            "An umbrella with the logo, providing shelter to a family, symbolizing protection. Shot with a dramatic, cinematic feel.",
            "A credit card with the logo, captured in a macro shot, highlighting the details of the card's chip and texture.",
            "A logo on a digital welcome screen in the foyer of a sleek, architectural headquarters building. The perspective is wide, showing the scale.",
        ]
    },
    'Real Estate': {
        description: "The aesthetic should be aspirational, professional, and welcoming. Use images of beautiful homes, modern architecture, and happy families. The mood should convey a sense of trust and expertise in property. High-quality photography is key.",
        prompts: [
            "Close-up of a house key with the logo on a custom keychain, held in a hand unlocking a door. The welcoming front porch is blurred in the background.",
            "A logo on a sleek, modern 'For Sale' sign, shot from a low angle against a stunning architectural home at twilight with glowing interior lights.",
            "The logo watermarked on the corner of a beautiful architectural blueprint, laid out on a dark wood table with drafting tools.",
            "A welcome mat in front of an elegant front door, with the logo cleanly printed on it.",
            "The logo on the side of a folder being exchanged between a real estate agent and a happy couple, with their new home out of focus behind them.",
            "A drone shot looking down at a swimming pool of a luxury property, with the logo tastefully placed on a poolside lounge chair.",
            "The logo on a set of wine glasses, being used for a celebratory toast by new homeowners on their balcony overlooking a city view.",
            "A high-end property brochure with the logo on the cover, resting on the marble countertop of a brand new, luxurious kitchen.",
        ]
    },
    'Retail & E-commerce': {
        description: "The aesthetic should be eye-catching and product-focused. The style can vary widely depending on the product, from playful and colorful to sleek and luxurious. The logo is a key part of the packaging and branding.",
        prompts: [
            "An exciting unboxing experience shot from above. Hands are opening a branded shipping box with the logo on the inside lid. Soft studio lighting.",
            "A logo on a boutique's canvas tote bag, slung over the shoulder of a shopper browsing a vibrant farmer's market. Candid lifestyle shot.",
            "Close-up of a price tag with the logo, attached to a piece of clothing on a rack in a well-lit, trendy retail store.",
            "The logo printed on the side of a delivery van, captured with a motion blur effect as it drives through a bustling city street.",
            "A loyalty card with the logo, being handed over a counter by a friendly cashier. The background is a warm, inviting shop interior.",
            "The logo on a product box, sitting on a shelf surrounded by other beautifully designed packages. The lighting highlights the product.",
            "A person's hands typing on a laptop, with the e-commerce website showing the logo clearly in the header. The scene is cozy, perhaps at home.",
            "A branded gift card with the logo, artfully placed in a flat lay with tissue paper and a ribbon, ready to be gifted.",
        ]
    },
     'Travel & Hospitality': {
        description: "The aesthetic should be evocative and inspiring, creating a sense of wanderlust or comfort. Use beautiful scenery, luxurious hotel interiors, or exciting destinations. The mood should be relaxing, adventurous, or welcoming, depending on the brand.",
        prompts: [
            "Close-up of a leather luggage tag with the logo embossed on it, attached to a vintage suitcase in an opulent hotel lobby with warm bokeh.",
            "Logo embroidered on a fluffy white hotel towel, artfully folded on a bed in a sun-drenched room with a view of the ocean.",
            "The logo on a boarding pass being held by a traveler, with the blurred background of an airport departure gate and an airplane.",
            "A menu with the logo on it, sitting on a table at a resort's outdoor restaurant, overlooking a tropical sunset.",
            "The logo etched into a wooden sign at the entrance to a rustic mountain lodge, with snow-covered pines in the background.",
            "A passport with a custom cover showing the logo, placed on a map next to a compass and a camera. Adventurous flat lay.",
            "The logo on the sail of a boat, cruising on a crystal clear turquoise sea. The shot is bright, sunny, and aspirational.",
            "A room key card with the logo, held against the door of a hotel room, with the hallway stretching out in a cinematic perspective.",
        ]
    }
};

const aspectRatios = [
    { label: 'Landscape', value: '1920:1080', icon: <LandscapeIcon className="w-5 h-5" /> },
    { label: 'Square', value: '1080:1080', icon: <SquareIcon className="w-5 h-5" /> },
    { label: 'Portrait', value: '1080:1920', icon: <PortraitIcon className="w-5 h-5" /> },
];

const imageCounts = [1, 2, 4];

type GenerationMode = 'description' | 'image';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onEditComplete: (newImageUrl: string) => void;
}

const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ isOpen, onClose, imageSrc, onEditComplete }) => {
    const imageCanvasRef = useRef<HTMLCanvasElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);
    const lastPos = useRef<{ x: number, y: number } | null>(null);
    const isDrawing = useRef(false);
    const [brushSize, setBrushSize] = useState(40);
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const maskHistory = useRef<ImageData[]>([]);
    
    useEffect(() => {
        if (!isOpen) return;
        
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.src = imageSrc;
        
        image.onload = () => {
            const imageCanvas = imageCanvasRef.current;
            const maskCanvas = maskCanvasRef.current;
            if (!imageCanvas || !maskCanvas) return;

            const { width, height } = image;
            imageCanvas.width = width;
            imageCanvas.height = height;
            maskCanvas.width = width;
            maskCanvas.height = height;

            const imageCtx = imageCanvas.getContext('2d');
            imageCtx?.drawImage(image, 0, 0);

            clearMask(true);
        };
    }, [isOpen, imageSrc]);

    const getCanvasPos = (canvas: HTMLCanvasElement, e: MouseEvent | TouchEvent) => {
        const rect = canvas.getBoundingClientRect();
        const touch = e instanceof TouchEvent ? e.touches[0] : e;
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY,
        };
    };

    const draw = (e: MouseEvent | TouchEvent) => {
        if (!isDrawing.current) return;
        const maskCanvas = maskCanvasRef.current;
        const ctx = maskCanvas?.getContext('2d');
        if (!ctx) return;

        const pos = getCanvasPos(maskCanvas!, e);
        if (lastPos.current) {
            ctx.beginPath();
            ctx.moveTo(lastPos.current.x, lastPos.current.y);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        }
        lastPos.current = pos;
    };

    const startDrawing = (e: MouseEvent | TouchEvent) => {
        const maskCanvas = maskCanvasRef.current;
        const ctx = maskCanvas?.getContext('2d');
        if (!ctx) return;

        // Save state for undo
        maskHistory.current.push(ctx.getImageData(0, 0, maskCanvas!.width, maskCanvas!.height));
        if (maskHistory.current.length > 10) maskHistory.current.shift(); // Limit history

        isDrawing.current = true;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(255, 0, 255, 0.7)';
        lastPos.current = getCanvasPos(maskCanvas!, e);
    };

    const stopDrawing = () => {
        isDrawing.current = false;
        lastPos.current = null;
    };
    
    const handleUndo = () => {
        if (maskHistory.current.length === 0) return;
        const maskCanvas = maskCanvasRef.current;
        const ctx = maskCanvas?.getContext('2d');
        const lastState = maskHistory.current.pop();
        if (ctx && lastState) {
            ctx.putImageData(lastState, 0, 0);
        }
    };

    const clearMask = (resetHistory = false) => {
        const maskCanvas = maskCanvasRef.current;
        const ctx = maskCanvas?.getContext('2d');
        ctx?.clearRect(0, 0, maskCanvas?.width ?? 0, maskCanvas?.height ?? 0);
        if (resetHistory) {
            maskHistory.current = [];
        }
    };
    
    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const imageCanvas = imageCanvasRef.current;
            const maskCanvas = maskCanvasRef.current;
            if (!imageCanvas || !maskCanvas) throw new Error("Canvas not ready");

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = imageCanvas.width;
            tempCanvas.height = imageCanvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            if (!tempCtx) throw new Error("Could not create temp canvas context");

            // Draw original image
            tempCtx.drawImage(imageCanvas, 0, 0);

            // "Cut out" the masked area by making it transparent
            tempCtx.globalCompositeOperation = 'destination-out';
            tempCtx.drawImage(maskCanvas, 0, 0);
            
            const imageWithTransparency = tempCanvas.toDataURL('image/png');
            
            const result = await inpaintImage(imageWithTransparency, prompt);
            onEditComplete(result);
            onClose();

        } catch(e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred during editing.');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-[#1C1C1C] rounded-xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex-grow flex flex-col items-center justify-center p-4 relative bg-[#111]">
                    <div className="relative w-full h-full" onMouseLeave={stopDrawing}>
                        <canvas ref={imageCanvasRef} className="absolute inset-0 w-full h-full object-contain" />
                        <canvas 
                            ref={maskCanvasRef} 
                            className="absolute inset-0 w-full h-full object-contain cursor-crosshair"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                    </div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm p-2 rounded-xl flex items-center gap-4">
                        <label htmlFor="brush-size" className="text-xs text-gray-300">Brush Size</label>
                        <input id="brush-size" type="range" min="5" max="150" value={brushSize} onChange={(e) => setBrushSize(parseInt(e.target.value, 10))} className="w-32" />
                        <div className="h-4 w-px bg-gray-600" />
                        <button onClick={handleUndo} title="Undo" className="p-2 text-gray-300 hover:text-white transition"><UndoIcon className="w-5 h-5"/></button>
                        <button onClick={() => clearMask()} title="Clear Mask" className="p-2 text-gray-300 hover:text-white transition"><RefreshIcon className="w-5 h-5"/></button>
                    </div>
                </div>

                <div className="w-[320px] flex-shrink-0 bg-[#111] border-l border-gray-800 p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">Edit Image</h3>
                        <button onClick={onClose} className="p-1 text-gray-500 hover:text-white transition"><XIcon className="w-5 h-5" /></button>
                    </div>
                    {error && <ErrorDisplay message={error} onClose={() => setError(null)} />}
                    <div className="flex flex-col flex-grow">
                        <label htmlFor="edit-prompt" className="block mb-1.5 text-sm font-medium text-gray-300">Describe your edit</label>
                        <textarea 
                          id="edit-prompt"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder="e.g., add a small bird, change color to red..."
                          className="w-full h-32 bg-gray-800 border border-gray-700 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none p-2.5 text-sm rounded-lg"
                        />

                        <div className="mt-auto pt-6">
                            <button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="w-full inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-semibold rounded-lg shadow-sm transition-all duration-200">
                                {isGenerating ? <Spinner className="text-black -ml-1 mr-3" /> : <WandIcon className="w-5 h-5 mr-2" />}
                                {isGenerating ? 'Generating...' : 'Generate Edit'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [description, setDescription] = useState<string>('');
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>('1920:1080');
  const [numImages, setNumImages] = useState<number>(1);
  const [businessCategory, setBusinessCategory] = useState<string>(Object.keys(businessCategories)[0]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isRewriting, setIsRewriting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [history, setHistory] = useState<string[][]>([]);
  const [examples, setExamples] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState<GenerationMode>('description');
  const [isEditingModalOpen, setIsEditingModalOpen] = useState<boolean>(false);
  const [editingImage, setEditingImage] = useState<{url: string; index: number} | null>(null);


  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const baseImageFileInputRef = useRef<HTMLInputElement>(null);

  const handleRefreshExamples = useCallback(() => {
    // @ts-ignore
    const promptsForCategory = businessCategories[businessCategory]?.prompts || [];
    const shuffled = [...promptsForCategory].sort(() => 0.5 - Math.random());
    setExamples(shuffled.slice(0, 4));
  }, [businessCategory]);

  useEffect(() => {
    handleRefreshExamples();
  }, [businessCategory, handleRefreshExamples]);
  
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      const imageItem = Array.from(items).find(item => item.type.startsWith('image/'));
      
      if (imageItem) {
          const file = imageItem.getAsFile();
          if (file) {
              event.preventDefault();
              
              const reader = new FileReader();
              reader.onload = (e) => {
                  const result = e.target?.result as string;
                  setBaseImage(result);
              };
              reader.readAsDataURL(file);
          }
      }
    };

    if (generationMode === 'image') {
      window.addEventListener('paste', handlePaste);
      return () => {
        window.removeEventListener('paste', handlePaste);
      };
    }
  }, [generationMode]);

  const handleRewrite = useCallback(async () => {
    if (!description.trim()) return;

    setIsRewriting(true);
    setError(null);
    try {
        const rewrittenText = await rewriteDescription(description);
        setDescription(rewrittenText);
    } catch(e) {
        setError(e instanceof Error ? e.message : 'An unknown error occurred during rewrite.');
    } finally {
        setIsRewriting(false);
    }
  }, [description]);

  const handleGenerate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    setCurrentImages([]);
    
    try {
        let results: string[] = [];
        if (generationMode === 'description') {
            if (!description || !logoImage) {
                 setError("Please provide a description and a logo.");
                 setIsGenerating(false);
                 return;
            }
            // @ts-ignore
            const industryDescription = businessCategories[businessCategory].description;
            const generationPromises = Array.from({ length: numImages }, () => 
                generateFinalMockup(description, logoImage!, aspectRatio, industryDescription)
            );
            results = await Promise.all(generationPromises);
        } else { // Image mode
            if (!baseImage || !logoImage) {
                setError("Please provide a base image and a logo.");
                setIsGenerating(false);
                return;
            }
            const generationPromises = Array.from({ length: numImages }, () => 
                generateImageBasedMockup(baseImage!, logoImage!, aspectRatio)
            );
            results = await Promise.all(generationPromises);
        }
      
      setCurrentImages(results);
      setHistory(prev => [results, ...prev]);

    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'An unknown error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  }, [description, logoImage, baseImage, aspectRatio, businessCategory, numImages, generationMode]);

  const handleClearForm = () => {
    setDescription('');
    setLogoImage(null);
    setBaseImage(null);
    if (logoFileInputRef.current) logoFileInputRef.current.value = '';
    if (baseImageFileInputRef.current) baseImageFileInputRef.current.value = '';
    handleRefreshExamples();
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, setImage: (data: string | null) => void) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditComplete = (newImageUrl: string) => {
      if (!editingImage) return;

      const updatedImages = [...currentImages];
      updatedImages[editingImage.index] = newImageUrl;
      setCurrentImages(updatedImages);

      const currentHistoryIndex = history.findIndex(group => group.includes(editingImage.url));
      if (currentHistoryIndex > -1) {
          const updatedHistory = [...history];
          const newGroup = [...updatedHistory[currentHistoryIndex]];
          newGroup[editingImage.index] = newImageUrl;
          updatedHistory[currentHistoryIndex] = newGroup;
          setHistory(updatedHistory);
      }
      
      setEditingImage(null);
      setIsEditingModalOpen(false);
  };
  
  const isGenerateDisabled = isGenerating || !logoImage || (generationMode === 'description' ? !description.trim() : !baseImage);

  return (
    <div className="min-h-screen bg-black text-gray-200 flex flex-col">
      <Header />
      <main className="flex-grow flex flex-col md:flex-row w-full p-4 gap-4">
        {/* Left Panel: Controls */}
        <div className="w-full md:w-[400px] flex-shrink-0 bg-[#111] p-6 rounded-xl flex flex-col gap-4 self-start">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">
                    {generationMode === 'description' ? 'Create with Description' : 'Create from Image'}
                </h2>
                <button
                    onClick={() => setGenerationMode(m => m === 'description' ? 'image' : 'description')}
                    title={generationMode === 'description' ? 'Switch to Image Mode' : 'Switch to Description Mode'}
                    aria-label="Switch generation mode"
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-full transition-all"
                >
                    {generationMode === 'description' ? <ImageIcon className="w-5 h-5" /> : <TextIcon className="w-5 h-5" />}
                </button>
            </div>
          
          <form onSubmit={handleGenerate} className="flex flex-col flex-grow">
             {error && <ErrorDisplay message={error} onClose={() => setError(null)} />}
            
            <div className="flex-grow animate-fade-in" key={generationMode}>
              {generationMode === 'description' ? (
                <div className="space-y-6 mt-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 flex items-center justify-center border border-gray-700 rounded-full text-sm font-semibold text-gray-200">1</div>
                        <h2 className="text-lg font-semibold text-white">Describe Your Mockup</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="mockup-description" className="block mb-1.5 text-sm font-medium text-gray-300">Prompt</label>
                            <div className="relative">
                                <div className="border border-gray-700 rounded-lg focus-within:ring-2 focus-within:ring-white/50 transition p-1">
                                    <textarea id="mockup-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., a white baseball cap..." className="w-full h-20 bg-transparent text-gray-200 placeholder-gray-500 focus:outline-none resize-none p-2 pr-10 text-sm" />
                                </div>
                                {description.trim().length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleRewrite}
                                        disabled={isRewriting}
                                        title="Rewrite with AI for clarity"
                                        aria-label="Rewrite description for clarity"
                                        className="absolute bottom-3 right-3 p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isRewriting ? <Spinner className="w-4 h-4 text-white" /> : <SparklesIcon className="w-4 h-4" />}
                                    </button>
                                )}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="business-category" className="block mb-1.5 text-sm font-medium text-gray-300">Business Category</label>
                            <div className="relative">
                                <select
                                    id="business-category"
                                    value={businessCategory}
                                    onChange={(e) => setBusinessCategory(e.target.value)}
                                    className="w-full appearance-none bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg focus:ring-white/50 focus:border-white/50 block p-2.5 pr-8 transition"
                                >
                                    {Object.keys(businessCategories).map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                                <ChevronDownIcon className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between pt-1">
                            <p className="text-xs text-gray-400">Or try an example for '{businessCategory}':</p>
                            <button type="button" onClick={handleRefreshExamples} aria-label="Refresh examples" className="text-gray-400 hover:text-white transition"><RefreshIcon className="w-4 h-4" /></button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {examples.map((ex, i) => (
                                <button key={i} type="button" onClick={() => setDescription(ex)} className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2.5 py-1 rounded-md transition text-left leading-snug">
                                    {ex}
                                </button>
                            ))}
                        </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 flex items-center justify-center border border-gray-700 rounded-full text-sm font-semibold text-gray-200">2</div>
                        <h2 className="text-lg font-semibold text-white">Upload Your Logo</h2>
                    </div>
                    <input type="file" ref={logoFileInputRef} onChange={(e) => handleFileChange(e, setLogoImage)} accept="image/*" className="hidden" />
                    <button type="button" onClick={() => logoFileInputRef.current?.click()} className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-700 hover:border-gray-500 rounded-lg transition">
                        {logoImage ? <img src={logoImage} alt="Logo preview" className="max-h-24 object-contain p-2" /> : (<><UploadIcon className="w-8 h-8 text-gray-500" /><span className="mt-2 text-sm font-semibold text-gray-400">Click to upload</span></>)}
                    </button>
                    {logoImage && <p className='text-xs text-center mt-2 text-gray-400'>Click image to change logo.</p>}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 flex items-center justify-center border border-gray-700 rounded-full text-sm font-semibold text-gray-200">3</div>
                        <h2 className="text-lg font-semibold text-white">Image Settings</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1.5 text-xs font-medium text-gray-400 text-center">Aspect Ratio</label>
                            <div className="grid grid-cols-3 gap-1">
                                {aspectRatios.map(ratio => (
                                    <button type="button" key={ratio.value} onClick={() => setAspectRatio(ratio.value)} title={ratio.label} className={`flex flex-col items-center justify-center p-2 rounded-md border text-xs font-medium transition ${aspectRatio === ratio.value ? 'bg-white text-black border-white' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}>
                                        {ratio.icon}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1.5 text-xs font-medium text-gray-400 text-center">Outputs</label>
                            <div className="grid grid-cols-3 gap-1">
                                {imageCounts.map(num => (
                                    <button type="button" key={num} onClick={() => setNumImages(num)} className={`flex items-center justify-center p-2 rounded-md border text-sm font-medium transition ${numImages === num ? 'bg-white text-black border-white' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}>
                                        <span className='font-semibold'>{num}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 mt-4">
                   <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-7 h-7 flex items-center justify-center border border-gray-700 rounded-full text-sm font-semibold text-gray-200">1</div>
                            <h2 className="text-lg font-semibold text-white">Upload Base Image</h2>
                        </div>
                        <input type="file" ref={baseImageFileInputRef} onChange={(e) => handleFileChange(e, setBaseImage)} accept="image/*" className="hidden" />
                        <button type="button" onClick={() => baseImageFileInputRef.current?.click()} className="w-full h-40 flex flex-col items-center justify-center border-2 border-dashed border-gray-700 hover:border-gray-500 rounded-lg transition">
                            {baseImage ? <img src={baseImage} alt="Base image preview" className="max-h-32 object-contain p-2" /> : (<><ImageIcon className="w-8 h-8 text-gray-500" /><span className="mt-2 text-sm font-semibold text-gray-400">Click to upload or paste image</span></>)}
                        </button>
                        {baseImage && <p className='text-xs text-center mt-2 text-gray-400'>Click image to change base image.</p>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 flex items-center justify-center border border-gray-700 rounded-full text-sm font-semibold text-gray-200">2</div>
                        <h2 className="text-lg font-semibold text-white">Upload Your Logo</h2>
                    </div>
                    <input type="file" ref={logoFileInputRef} onChange={(e) => handleFileChange(e, setLogoImage)} accept="image/*" className="hidden" />
                    <button type="button" onClick={() => logoFileInputRef.current?.click()} className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-700 hover:border-gray-500 rounded-lg transition">
                        {logoImage ? <img src={logoImage} alt="Logo preview" className="max-h-24 object-contain p-2" /> : (<><UploadIcon className="w-8 h-8 text-gray-500" /><span className="mt-2 text-sm font-semibold text-gray-400">Click to upload logo</span></>)}
                    </button>
                    {logoImage && <p className='text-xs text-center mt-2 text-gray-400'>Click image to change logo.</p>}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 flex items-center justify-center border border-gray-700 rounded-full text-sm font-semibold text-gray-200">3</div>
                        <h2 className="text-lg font-semibold text-white">Image Settings</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1.5 text-xs font-medium text-gray-400 text-center">Aspect Ratio</label>
                            <div className="grid grid-cols-3 gap-1">
                                {aspectRatios.map(ratio => (
                                    <button type="button" key={ratio.value} onClick={() => setAspectRatio(ratio.value)} title={ratio.label} className={`flex flex-col items-center justify-center p-2 rounded-md border text-xs font-medium transition ${aspectRatio === ratio.value ? 'bg-white text-black border-white' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}>
                                        {ratio.icon}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1.5 text-xs font-medium text-gray-400 text-center">Outputs</label>
                            <div className="grid grid-cols-3 gap-1">
                                {imageCounts.map(num => (
                                    <button type="button" key={num} onClick={() => setNumImages(num)} className={`flex items-center justify-center p-2 rounded-md border text-sm font-medium transition ${numImages === num ? 'bg-white text-black border-white' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}>
                                        <span className='font-semibold'>{num}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto pt-6 space-y-2">
                <button type="submit" disabled={isGenerateDisabled} className="w-full inline-flex items-center justify-center px-6 py-3 bg-white hover:bg-gray-200 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-black font-semibold rounded-lg shadow-sm transition-all duration-200">
                  {isGenerating ? <Spinner className="text-black -ml-1 mr-3" /> : <WandIcon className="w-5 h-5 mr-2" />}
                  {isGenerating ? 'Generating...' : 'Generate Mockup'}
                </button>
                {history.length > 0 && !isGenerating && (
                    <button type="button" onClick={handleClearForm} className="w-full inline-flex items-center justify-center text-sm text-gray-400 hover:text-white font-medium py-2">
                        <PlusCircleIcon className="w-4 h-4 mr-1.5" />
                        Create Another
                    </button>
                )}
            </div>
          </form>
        </div>

        {/* Right Panel: Results */}
        <div className="flex-grow flex gap-4">
            <div className="flex-grow bg-[#111] rounded-xl flex items-center justify-center p-4 relative min-h-[400px] md:min-h-0">
              {isGenerating && (
                <div className="text-center">
                    <Spinner className="text-white mx-auto h-8 w-8" />
                    <h2 className="text-lg font-semibold mt-4">Creating your masterpiece...</h2>
                    <p className="text-gray-400 mt-2 text-sm">The AI is warming up. This may take a moment.</p>
                </div>
              )}
              {!isGenerating && currentImages.length === 0 && (
                <div className="text-center text-gray-500">
                  <WandIcon className="w-12 h-12 mx-auto mb-4" />
                  <h2 className="text-lg font-semibold">Your mockups will appear here</h2>
                  <p className="text-sm">Fill out the details on the left and click "Generate".</p>
                </div>
              )}
              {!isGenerating && currentImages.length > 0 && (
                <div className={`grid gap-2 ${currentImages.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} max-w-full max-h-full`}>
                  {currentImages.map((img, index) => (
                    <div key={index} className="relative group flex items-center justify-center">
                      <img src={img} alt={`Generated Mockup ${index + 1}`} className="max-w-full max-h-full object-contain rounded-lg animate-fade-in" />
                      <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => { setEditingImage({ url: img, index }); setIsEditingModalOpen(true); }}
                          className="p-2 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white rounded-full shadow-sm"
                          title="Edit image"
                          aria-label="Edit image"
                        >
                          <BrushIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setModalImage(img); setIsModalOpen(true); }}
                          className="p-2 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white rounded-full shadow-sm"
                          title="View full size"
                          aria-label="View full size"
                        >
                          <ExpandIcon className="w-4 h-4" />
                        </button>
                        <a href={img} download={`mockup-${index + 1}.png`} title="Download" aria-label="Download image" className="p-2 bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white rounded-full shadow-sm">
                          <DownloadIcon className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="w-24 flex-shrink-0 bg-[#111] rounded-xl p-2 flex flex-col gap-2">
              <h3 className="text-xs text-center text-gray-500 font-medium mb-1 flex-shrink-0">History</h3>
              <div className="overflow-y-auto flex-grow flex flex-col gap-2">
                {history.length > 0 ? (
                  history.map((imageGroup, groupIndex) => (
                      <button key={groupIndex} onClick={() => setCurrentImages(imageGroup)} className={`relative rounded-md overflow-hidden transition-all duration-200 block w-full aspect-square flex-shrink-0 group ${currentImages === imageGroup ? 'ring-2 ring-offset-2 ring-offset-black ring-white' : 'ring-1 ring-gray-700 hover:ring-gray-500'}`}>
                          <img src={imageGroup[0]} alt={`History set ${groupIndex + 1}`} className="w-full h-full object-cover"/>
                          {imageGroup.length > 1 && (
                            <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                                {imageGroup.length}
                            </span>
                          )}
                      </button>
                  ))
                ) : (
                  <div className="text-center text-xs text-gray-600 pt-4">
                      Your results will appear here.
                  </div>
                )}
              </div>
            </div>
        </div>
      </main>

      {/* Fullscreen Image Modal */}
      {isModalOpen && modalImage && (
          <div
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
              onClick={() => setIsModalOpen(false)}
          >
              <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 text-white hover:text-gray-300 transition-opacity z-50"
                  aria-label="Close"
              >
                  <XIcon className="w-8 h-8" />
              </button>
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <img
                      src={modalImage}
                      alt="Generated Mockup Full Size"
                      className="max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl"
                  />
              </div>
          </div>
      )}

       {isEditingModalOpen && editingImage && (
          <ImageEditorModal
              isOpen={isEditingModalOpen}
              onClose={() => setIsEditingModalOpen(false)}
              imageSrc={editingImage.url}
              onEditComplete={handleEditComplete}
          />
      )}
    </div>
  );
};

export default App;