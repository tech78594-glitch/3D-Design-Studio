export interface VoiceCommandMatch {
  action:
    | 'explode'
    | 'blueprint'
    | 'shaded'
    | 'wireframe'
    | 'xray'
    | 'export_3mf'
    | 'export_stl'
    | 'mass_calculator'
    | 'edge_selection'
    | 'physics_sim'
    | 'design_engine'
    | 'chat'
    | 'auto_texture'
    | 'undo'
    | 'redo'
    | 'toggle_grid'
    | 'reset_view';
  rawTranscript: string;
  confidence: number;
  feedbackText: string;
}

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'error' | 'unsupported';

export class VoiceCommandEngine {
  private recognition: any = null;
  private isSupported: boolean = false;
  private statusCallback?: (status: VoiceStatus, transcript?: string) => void;
  private commandCallback?: (match: VoiceCommandMatch) => void;

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.isSupported = true;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.setupListeners();
    }
  }

  public getIsSupported(): boolean {
    return this.isSupported;
  }

  public setCallbacks(
    onStatus: (status: VoiceStatus, transcript?: string) => void,
    onCommand: (match: VoiceCommandMatch) => void
  ): void {
    this.statusCallback = onStatus;
    this.commandCallback = onCommand;
  }

  private setupListeners(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      if (this.statusCallback) this.statusCallback('listening', '');
    };

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const currentText = finalTranscript || interim;
      if (this.statusCallback) this.statusCallback('processing', currentText);

      if (finalTranscript) {
        const match = this.parseTranscript(finalTranscript.toLowerCase());
        if (match && this.commandCallback) {
          this.commandCallback(match);
          this.speakFeedback(match.feedbackText);
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      console.warn('Voice Command Recognition Error:', event.error);
      if (this.statusCallback) this.statusCallback('error', `Speech error: ${event.error}`);
    };

    this.recognition.onend = () => {
      if (this.statusCallback) this.statusCallback('idle');
    };
  }

  public startListening(): void {
    if (this.recognition && this.isSupported) {
      try {
        this.recognition.start();
      } catch (e) {
        // Recognition already started
      }
    } else if (this.statusCallback) {
      this.statusCallback('unsupported');
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isSupported) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }

  public parseTranscript(text: string): VoiceCommandMatch | null {
    const t = text.trim();

    if (t.includes('explode') || t.includes('disassemble')) {
      return { action: 'explode', rawTranscript: t, confidence: 0.95, feedbackText: 'Toggling Exploded View Mode' };
    }
    if (t.includes('blueprint')) {
      return { action: 'blueprint', rawTranscript: t, confidence: 0.98, feedbackText: 'Switching to Blueprint View Mode' };
    }
    if (t.includes('shaded')) {
      return { action: 'shaded', rawTranscript: t, confidence: 0.95, feedbackText: 'Switching to Shaded Mode' };
    }
    if (t.includes('wireframe')) {
      return { action: 'wireframe', rawTranscript: t, confidence: 0.95, feedbackText: 'Switching to Wireframe Mode' };
    }
    if (t.includes('x-ray') || t.includes('xray')) {
      return { action: 'xray', rawTranscript: t, confidence: 0.95, feedbackText: 'Switching to X-Ray Mode' };
    }
    if (t.includes('export 3mf') || t.includes('export three mf') || t.includes('save 3mf')) {
      return { action: 'export_3mf', rawTranscript: t, confidence: 0.95, feedbackText: 'Exporting 3MF Package' };
    }
    if (t.includes('export stl') || t.includes('save stl')) {
      return { action: 'export_stl', rawTranscript: t, confidence: 0.95, feedbackText: 'Exporting STL Mesh' };
    }
    if (t.includes('mass') || t.includes('weight') || t.includes('density')) {
      return { action: 'mass_calculator', rawTranscript: t, confidence: 0.92, feedbackText: 'Opening Real-time Mass Calculator' };
    }
    if (t.includes('edge') || t.includes('select edge')) {
      return { action: 'edge_selection', rawTranscript: t, confidence: 0.92, feedbackText: 'Toggling Smart Edge Selection' };
    }
    if (t.includes('physics') || t.includes('gravity') || t.includes('drop test')) {
      return { action: 'physics_sim', rawTranscript: t, confidence: 0.94, feedbackText: 'Opening 3D Physics Simulation Studio' };
    }
    if (t.includes('design engine') || t.includes('generate design') || t.includes('ai design')) {
      return { action: 'design_engine', rawTranscript: t, confidence: 0.94, feedbackText: 'Opening AI CAD Design Engine' };
    }
    if (t.includes('chat') || t.includes('collaboration') || t.includes('messages')) {
      return { action: 'chat', rawTranscript: t, confidence: 0.94, feedbackText: 'Opening Project Collaboration Chat' };
    }
    if (t.includes('texture') || t.includes('auto texture') || t.includes('material texture')) {
      return { action: 'auto_texture', rawTranscript: t, confidence: 0.94, feedbackText: 'Opening Automatic Texture Generator' };
    }
    if (t.includes('undo')) {
      return { action: 'undo', rawTranscript: t, confidence: 0.9, feedbackText: 'Undoing last action' };
    }
    if (t.includes('redo')) {
      return { action: 'redo', rawTranscript: t, confidence: 0.9, feedbackText: 'Redoing action' };
    }
    if (t.includes('grid')) {
      return { action: 'toggle_grid', rawTranscript: t, confidence: 0.9, feedbackText: 'Toggling CAD Grid visibility' };
    }
    if (t.includes('reset') || t.includes('home view')) {
      return { action: 'reset_view', rawTranscript: t, confidence: 0.9, feedbackText: 'Resetting 3D Viewport camera' };
    }

    return null;
  }

  public speakFeedback(text: string): void {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (e) {}
    }
  }
}
