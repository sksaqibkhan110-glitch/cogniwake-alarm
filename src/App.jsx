import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ChevronRight, Volume2, VolumeX, BellRing, Plus, Trash2, X, Check, 
  RefreshCw, Moon, Bell, Camera, Mic, Upload, Music, Flame, FileText, Activity, Calendar as CalendarIcon
} from 'lucide-react';
import { FilesetResolver, FaceLandmarker, PoseLandmarker } from '@mediapipe/tasks-vision';
import { supabase } from './supabase';

const LOCAL_STORAGE_KEY = 'cogniwake_alarm_state_v14';
const USER_ID_KEY = 'cogniwake_user_uid_v1';
const CUSTOM_AUDIO_KEY = 'cogniwake_custom_audio_cache_v1';

const WAKE_PHRASES = [
  "i am wide awake and ready to conquer the day",
  "rise and shine no more sleep today",
  "no excuses time to achieve my goals",
  "the sun is up and so am i",
  "today is a brand new opportunity"
];

// 5 Dedicated Bollywood Dance Tracks for Mission 4
const DANCE_PLAYLIST = [
  { id: 'bollywood', name: '🥁 Energetic Bollywood Track', src: '/sounds/Energetic Bollywood Track.mp3' },
  { id: 'disco', name: '💃 Kisi Disco Me Jaye', src: '/sounds/kisi disco me jaye.mp3' },
  { id: 'nacho', name: '🕺 Hil Hil Ke Nacho', src: '/sounds/Hil Hil ke Nacho Nacho.mp3' },
  { id: 'zohrajabeen', name: '✨ Aye Meri Zohrajabeen', src: '/sounds/Aye Meri Zohrajabeen.mp3' },
  { id: 'oyehoye', name: '🔥 Oye Hoye Kya Baat Hai', src: '/sounds/oye hoye kya.mp3' }
];

// 22 Full Audio Library
const DEFAULT_SOUNDS = [
  { id: 'america', name: '🎙️ America Kya Kehta Tha', type: 'audio', src: '/sounds/America Kya Kehta Tha.mp3', category: 'prank' },
  { id: 'baby_crying', name: '👶 Baby Crying Tears', type: 'audio', src: '/sounds/Baby Crying Tears.mp3', category: 'prank' },
  { id: 'chicken_screaming', name: '🐔 Chicken Screaming', type: 'audio', src: '/sounds/Chicken On Tree Screaming.mp3', category: 'prank' },
  { id: 'cat_meow', name: '🐱 Cute Cat Meowming', type: 'audio', src: '/sounds/Cute Cat Meowming.mp3', category: 'prank' },
  { id: 'bollywood', name: '🥁 Energetic Bollywood Track', type: 'audio', src: '/sounds/Energetic Bollywood Track.mp3', category: 'prank' },
  { id: 'funny_sounds', name: '😂 Funny Sounds', type: 'audio', src: '/sounds/Funny Sounds.mp3', category: 'prank' },
  { id: 'good_morning_greeting', name: '☀️ Good Morning Greeting', type: 'audio', src: '/sounds/Good Morning Greeting.mp3', category: 'prank' },
  { id: 'good_morning_pineapple', name: '🍍 Good Morning Pineapple', type: 'audio', src: '/sounds/Good Morning Pineapple.mp3', category: 'prank' },
  { id: 'jo_gareeb', name: '💸 Jo Gareeb Hove Naa', type: 'audio', src: '/sounds/Jo Gareeb Hove Naa.mp3', category: 'prank' },
  { id: 'modi_bhojyam', name: '🔊 Modi Ji Bhojyam', type: 'audio', src: '/sounds/Modi Ji Bhojyam.mp3', category: 'prank' },
  { id: 'modi_kids', name: '🧒 MODI MODI Kids', type: 'audio', src: '/sounds/MODI MODI, MODI MODI Kids.mp3', category: 'prank' },
  { id: 'sad_bgm', name: '🎻 Sad Music BGM India', type: 'audio', src: '/sounds/Sad Music BGM India Ver.mp3', category: 'prank' },

  { id: 'melodian', name: '🎵 Melodian (Default)', type: 'synth', category: 'default' },
  { id: 'bells', name: '🔔 Gentle Morning Bells', type: 'synth', category: 'default' },
  { id: 'cyber', name: '⚡ Cyber Synth Pulse', type: 'synth', category: 'default' },
  { id: 'digital', name: '⏰ Classic Digital Beep', type: 'synth', category: 'default' },
  { id: 'siren', name: '🚨 Siren Alert Extreme', type: 'synth', category: 'default' },

  { id: 'zen_garden', name: '🌿 Tibetan Zen Bowl', type: 'synth', category: 'relaxing' },
  { id: 'gentle_harp', name: '🎶 Soft Ambient Harp', type: 'synth', category: 'relaxing' },
  { id: 'ocean_breeze', name: '🌊 Ocean Calming Wave', type: 'synth', category: 'relaxing' },
  { id: 'morning_dew', name: '💧 Morning Rain Drops', type: 'synth', category: 'relaxing' },
  { id: 'cozy_lullaby', name: '✨ Dreamy Music Box', type: 'synth', category: 'relaxing' }
];

export default function App() {
  const [bedAngle, setBedAngle] = useState(0);
  const [wakeAngle, setWakeAngle] = useState(165);

  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [volume, setVolume] = useState(75);

  const [alarmNote, setAlarmNote] = useState('Gym & Morning Workout!');
  const [activeRingingNote, setActiveRingingNote] = useState('');

  // 4 Active Verification Missions
  const [enabledMissions, setEnabledMissions] = useState({
    math: true,
    eyes: true,
    voice: true,
    dance: true
  });
  const [isMissionConfigOpen, setIsMissionConfigOpen] = useState(false);

  // Active Dance Song Selector
  const [currentDanceTrackId, setCurrentDanceTrackId] = useState('bollywood');

  const [selectedSound, setSelectedSound] = useState('chicken_screaming');
  const [customAudioData, setCustomAudioData] = useState(null);
  const [isSoundSelectorOpen, setIsSoundSelectorOpen] = useState(false);

  // 2-Page Tab Navigation (sleep vs alarms)
  const [activeTab, setActiveTab] = useState('sleep');
  const [syncStatus, setSyncStatus] = useState('synced');

  const [alarms, setAlarms] = useState([
    { id: 1, time: '05.30', label: 'Sat, Sun', note: 'Morning Jogging', active: true, isDialSync: true },
    { id: 2, time: '07.00', label: 'Weekdays', note: 'College & Work Day', active: true, isDialSync: false },
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAlarmTime, setNewAlarmTime] = useState('07:00');
  const [newAlarmLabel, setNewAlarmLabel] = useState('Weekdays');
  const [newAlarmCustomNote, setNewAlarmCustomNote] = useState('');

  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [ringingAlarmInfo, setRingingAlarmInfo] = useState('');

  const [activePipeline, setActivePipeline] = useState([]);
  const [pipelineIndex, setPipelineIndex] = useState(0);
  const activePipelineRef = useRef([]);
  const pipelineIndexRef = useRef(0);

  // Step 1: Math
  const [mathProblem, setMathProblem] = useState({ question: '', answer: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [mathError, setMathError] = useState(false);

  // Step 2: Eyes Tracking
  const videoRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);
  const landmarkerRef = useRef(null);
  const [modelReady, setModelReady] = useState(false);
  const [eyesOpenStatus, setEyesOpenStatus] = useState('Initializing AI...');
  const [openEyesProgress, setOpenEyesProgress] = useState(0);
  const animFrameIdRef = useRef(null);
  const eyesOpenDurationRef = useRef(0);

  // Step 3: Voice State & Engine
  const [targetVoicePhrase, setTargetVoicePhrase] = useState(WAKE_PHRASES[0]);
  const targetVoicePhraseRef = useRef(WAKE_PHRASES[0]);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceVolumeLevel, setVoiceVolumeLevel] = useState(0);
  const [voiceError, setVoiceError] = useState('');
  const recognitionRef = useRef(null);
  const micStreamRef = useRef(null);
  const micAudioCtxRef = useRef(null);
  const micAnimRef = useRef(null);
  const manualStopRef = useRef(false);

  // Step 4: Strict Full-Body Dance Engine & 15-Sec Countdown Timer
  const danceVideoRef = useRef(null);
  const danceCanvasRef = useRef(null);
  const danceStreamRef = useRef(null);
  const danceAudioRef = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const [danceProgress, setDanceProgress] = useState(0);
  const [danceStatus, setDanceStatus] = useState('Step back & show full body!');
  const danceAnimRef = useRef(null);
  const danceScoreRef = useRef(0);
  const previousFullBodyLandmarksRef = useRef(null);

  const [danceTimeRemaining, setDanceTimeRemaining] = useState(15);
  const [danceFailed, setDanceFailed] = useState(false);
  const danceTimerIntervalRef = useRef(null);

  // Audio Engine Refs
  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);
  const soundIntervalRef = useRef(null);
  const activeAudioPlayerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [activeHandle, setActiveHandle] = useState(null);
  const dialRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const userIdRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Wake Lock API
  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {}
    };
    requestWakeLock();
    return () => {
      if (wakeLock) wakeLock.release().catch(() => {});
    };
  }, []);

  // Custom Audio Cache
  useEffect(() => {
    const cached = localStorage.getItem(CUSTOM_AUDIO_KEY);
    if (cached) setCustomAudioData(cached);
  }, []);

  // MediaPipe FaceLandmarker Init (CPU Delegate)
  useEffect(() => {
    let isMounted = true;
    async function initMediaPipe() {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "CPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1
        });
        if (isMounted) {
          landmarkerRef.current = landmarker;
          setModelReady(true);
        }
      } catch (e) {
        console.warn("MediaPipe model loading warning:", e);
      }
    }
    initMediaPipe();
    return () => { isMounted = false; };
  }, []);

  // Load from Supabase / LocalStorage
  useEffect(() => {
    let uid = localStorage.getItem(USER_ID_KEY);
    if (!uid) {
      uid = 'usr_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem(USER_ID_KEY, uid);
    }
    userIdRef.current = uid;

    const loadUserData = async () => {
      try {
        const { data, error } = await supabase
          .from('user_alarms')
          .select('*')
          .eq('user_id', uid)
          .single();

        if (data && !error) {
          if (typeof data.bed_angle === 'number') setBedAngle(Number(data.bed_angle));
          if (typeof data.wake_angle === 'number') setWakeAngle(Number(data.wake_angle));
          if (typeof data.alarm_enabled === 'boolean') setAlarmEnabled(data.alarm_enabled);
          if (typeof data.volume === 'number') setVolume(Number(data.volume));
          if (Array.isArray(data.alarms) && data.alarms.length > 0) setAlarms(data.alarms);
          if (data.alarms_meta?.alarmNote) setAlarmNote(data.alarms_meta.alarmNote);
          if (data.alarms_meta?.enabledMissions) setEnabledMissions(data.alarms_meta.enabledMissions);
          setSyncStatus('synced');
        } else {
          const localSaved = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (localSaved) {
            const p = JSON.parse(localSaved);
            if (p.bedAngle) setBedAngle(p.bedAngle);
            if (p.wakeAngle) setWakeAngle(p.wakeAngle);
            if (p.alarmNote) setAlarmNote(p.alarmNote);
            if (p.enabledMissions) setEnabledMissions(p.enabledMissions);
            if (p.volume) setVolume(p.volume);
            if (p.alarms) setAlarms(p.alarms);
          }
        }
      } catch (err) {
        setSyncStatus('offline');
      } finally {
        setIsLoaded(true);
      }
    };
    loadUserData();
  }, []);

  // Save to Supabase
  useEffect(() => {
    if (!isLoaded || !userIdRef.current) return;

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
      bedAngle, wakeAngle, alarmEnabled, volume, alarms, alarmNote, enabledMissions
    }));

    setSyncStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('user_alarms')
          .upsert({
            user_id: userIdRef.current,
            bed_angle: bedAngle,
            wake_angle: wakeAngle,
            alarm_enabled: alarmEnabled,
            volume: volume,
            alarms: alarms,
            alarms_meta: { alarmNote, enabledMissions },
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        setSyncStatus(!error ? 'synced' : 'offline');
      } catch (err) {
        setSyncStatus('offline');
      }
    }, 800);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [bedAngle, wakeAngle, alarmEnabled, volume, alarms, alarmNote, enabledMissions, isLoaded]);

  const handleVolumeChange = (newVal) => {
    const val = Number(newVal);
    setVolume(val);
    const normalized = Math.max(0, Math.min(1, val / 100));

    if (activeAudioPlayerRef.current) {
      activeAudioPlayerRef.current.volume = normalized;
    }
    if (gainNodeRef.current && audioCtxRef.current) {
      try {
        gainNodeRef.current.gain.setValueAtTime(normalized, audioCtxRef.current.currentTime);
      } catch (e) {}
    }
  };

  const ensureAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
      gainNodeRef.current = audioCtxRef.current.createGain();
      gainNodeRef.current.connect(audioCtxRef.current.destination);
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume / 100, audioCtxRef.current.currentTime);
    }
  };

  const playOscillator = (freq, type, startTime, duration, baseVol = 0.35) => {
    if (!audioCtxRef.current || !gainNodeRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const noteGain = audioCtxRef.current.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(baseVol, startTime + 0.03);
    noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.connect(noteGain);
    noteGain.connect(gainNodeRef.current);
    osc.start(startTime);
    osc.stop(startTime + duration);
  };

  const playSynthPattern = (snd) => {
    ensureAudioContext();
    const now = audioCtxRef.current.currentTime;

    switch (snd) {
      case 'bells':
        playOscillator(587.33, 'sine', now, 0.6, 0.35);
        playOscillator(783.99, 'sine', now + 0.3, 0.7, 0.35);
        playOscillator(880.00, 'sine', now + 0.7, 0.9, 0.4);
        break;
      case 'cyber':
        [600, 750, 900, 1200].forEach((f, i) => {
          playOscillator(f, 'sawtooth', now + i * 0.14, 0.15, 0.3);
        });
        break;
      case 'digital':
        [0, 0.2, 0.4].forEach((t) => {
          playOscillator(1046.5, 'square', now + t, 0.1, 0.35);
        });
        break;
      case 'siren':
        const osc = audioCtxRef.current.createOscillator();
        const sirenGain = audioCtxRef.current.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.linearRampToValueAtTime(950, now + 0.5);
        osc.frequency.linearRampToValueAtTime(500, now + 1.0);
        sirenGain.gain.setValueAtTime(0.4, now);
        osc.connect(sirenGain);
        sirenGain.connect(gainNodeRef.current);
        osc.start(now);
        osc.stop(now + 1.05);
        break;
      case 'zen_garden':
        playOscillator(216, 'sine', now, 2.5, 0.3);
        playOscillator(432, 'sine', now + 0.2, 2.0, 0.2);
        break;
      case 'gentle_harp':
        [261.63, 329.63, 392.00, 523.25, 659.25].forEach((f, i) => {
          playOscillator(f, 'sine', now + i * 0.25, 1.2, 0.2);
        });
        break;
      case 'ocean_breeze':
        playOscillator(160, 'sine', now, 1.8, 0.25);
        playOscillator(240, 'triangle', now + 0.4, 1.4, 0.2);
        break;
      case 'morning_dew':
        [784, 880, 1046, 1318].forEach((f, i) => {
          playOscillator(f, 'sine', now + i * 0.3, 0.5, 0.15);
        });
        break;
      case 'cozy_lullaby':
        [392, 440, 523, 659, 587, 523].forEach((f, i) => {
          playOscillator(f, 'triangle', now + i * 0.22, 0.6, 0.2);
        });
        break;
      case 'melodian':
      default:
        [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => {
          playOscillator(f, 'sine', now + i * 0.2, 0.4, 0.3);
        });
        break;
    }
  };

  const startMelodyLoop = (forcedSoundId = null) => {
    stopMelodyLoop();
    const soundToPlay = forcedSoundId || selectedSound;
    const volRatio = Math.max(0, Math.min(1, volume / 100));

    if (soundToPlay === 'custom' && customAudioData) {
      const audio = new Audio(customAudioData);
      audio.loop = true;
      audio.volume = volRatio;
      activeAudioPlayerRef.current = audio;
      audio.play().catch((err) => console.warn(err));
      return;
    }

    const matched = DEFAULT_SOUNDS.find((s) => s.id === soundToPlay);
    if (matched && matched.type === 'audio') {
      const audio = new Audio(matched.src);
      audio.loop = true;
      audio.volume = volRatio;
      activeAudioPlayerRef.current = audio;
      audio.play().catch((err) => console.warn('Audio play error:', err));
      return;
    }

    ensureAudioContext();
    playSynthPattern(soundToPlay);
    soundIntervalRef.current = setInterval(() => playSynthPattern(soundToPlay), 1800);
  };

  const stopMelodyLoop = () => {
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
    if (activeAudioPlayerRef.current) {
      try {
        activeAudioPlayerRef.current.pause();
        activeAudioPlayerRef.current.currentTime = 0;
      } catch (e) {}
      activeAudioPlayerRef.current = null;
    }
  };

  const handleSelectSound = (soundId) => {
    setSelectedSound(soundId);
    setIsSoundSelectorOpen(false);
    stopMelodyLoop();
    setTimeout(() => {
      startMelodyLoop(soundId);
      setIsPlayingPreview(true);
    }, 50);
  };

  const handleTogglePreview = () => {
    if (isPlayingPreview) {
      stopMelodyLoop();
      setIsPlayingPreview(false);
    } else {
      startMelodyLoop();
      setIsPlayingPreview(true);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setCustomAudioData(base64);
      localStorage.setItem(CUSTOM_AUDIO_KEY, base64);
      handleSelectSound('custom');
    };
    reader.readAsDataURL(file);
  };

  const buildPipeline = () => {
    const pipe = [];
    if (enabledMissions.math) pipe.push('math');
    if (enabledMissions.eyes) pipe.push('eyes');
    if (enabledMissions.voice) pipe.push('voice');
    if (enabledMissions.dance) pipe.push('dance');
    return pipe;
  };

  // STEP 1: MATH MISSION
  const generateMathMission = useCallback(() => {
    const isAddition = Math.random() > 0.5;
    const n1 = Math.floor(Math.random() * 40) + 12;
    const n2 = Math.floor(Math.random() * 30) + 7;
    if (isAddition) setMathProblem({ question: `${n1} + ${n2}`, answer: n1 + n2 });
    else {
      const high = Math.max(n1, n2);
      const low = Math.min(n1, n2);
      setMathProblem({ question: `${high} - ${low}`, answer: high - low });
    }
    setUserAnswer('');
    setMathError(false);
  }, []);

  // STEP 2: EYE TRACKING
  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  };

  const runDetectionLoop = () => {
    let lastVideoTime = -1;

    const detect = () => {
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        if (landmarkerRef.current) {
          if (video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;
            try {
              const results = landmarkerRef.current.detectForVideo(video, performance.now());

              if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                const categories = results.faceBlendshapes[0].categories;
                const blinkLeft = categories.find((c) => c.categoryName === 'eyeBlinkLeft')?.score || 0;
                const blinkRight = categories.find((c) => c.categoryName === 'eyeBlinkRight')?.score || 0;

                const isLeftOpen = blinkLeft < 0.38;
                const isRightOpen = blinkRight < 0.38;

                if (isLeftOpen && isRightOpen) {
                  eyesOpenDurationRef.current += 1.8;
                  setEyesOpenStatus('Both Eyes Open! Keep looking...');
                } else {
                  eyesOpenDurationRef.current = Math.max(0, eyesOpenDurationRef.current - 1.5);
                  if (!isLeftOpen && !isRightOpen) {
                    setEyesOpenStatus('Eyes Closed! Open both!');
                  } else {
                    setEyesOpenStatus('Open BOTH Eyes completely!');
                  }
                }

                const progress = Math.min(100, Math.round((eyesOpenDurationRef.current / 30) * 100));
                setOpenEyesProgress(progress);

                if (progress >= 100) {
                  stopCamera();
                  setEyesOpenStatus('Verified! Well done.');
                  setTimeout(() => advancePipeline(), 250);
                  return;
                }
              } else {
                setEyesOpenStatus('Face not centered. Look at camera!');
              }
            } catch (err) {
              console.warn("Detection frame error:", err);
            }
          }
        } else {
          setEyesOpenStatus('Loading Face AI Model...');
        }
      }
      animFrameIdRef.current = requestAnimationFrame(detect);
    };

    animFrameIdRef.current = requestAnimationFrame(detect);
  };

  const startEyeDetection = useCallback(async () => {
    eyesOpenDurationRef.current = 0;
    setOpenEyesProgress(0);
    setEyesOpenStatus('Starting Camera...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } }
      });
      setCameraStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play();
        setEyesOpenStatus('Looking for eyes...');
        runDetectionLoop();
      }
    } catch (e) {
      console.warn("Camera failed:", e);
      setEyesOpenStatus('Camera permission blocked!');
    }
  }, [modelReady]);

  // STEP 3: HIGH-ACCURACY VOICE RECOGNITION (WITH RE-ENABLED SKIP BUTTON)
  const stopMicrophoneEngine = () => {
    manualStopRef.current = true;
    setIsListening(false);

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }
    if (micAnimRef.current) cancelAnimationFrame(micAnimRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (micAudioCtxRef.current) {
      try { micAudioCtxRef.current.close(); } catch (e) {}
      micAudioCtxRef.current = null;
    }
  };

  const handleStartVoiceRecognition = async () => {
    if (isListening) return;
    setVoiceError('');
    setTranscript('');
    manualStopRef.current = false;
    setIsListening(true);

    stopMelodyLoop();

    let recognizedSpeechPassed = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (manualStopRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      micStreamRef.current = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      micAudioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const analyzeAudio = () => {
        if (manualStopRef.current) return;
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const average = sum / dataArray.length;
        setVoiceVolumeLevel(Math.min(100, Math.round((average / 128) * 100)));

        micAnimRef.current = requestAnimationFrame(analyzeAudio);
      };
      analyzeAudio();
    } catch (err) {
      stopMicrophoneEngine();
      setVoiceError('Microphone permission blocked! Allow mic.');
      startMelodyLoop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
          if (manualStopRef.current || recognizedSpeechPassed) return;

          let heardText = '';
          for (let i = 0; i < event.results.length; ++i) {
            heardText += event.results[i][0].transcript + ' ';
          }
          
          const cleanString = (val) => val
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

          const normalizedHeard = cleanString(heardText);
          const normalizedTarget = cleanString(targetVoicePhraseRef.current || targetVoicePhrase);
          setTranscript(normalizedHeard);

          const targetTokens = normalizedTarget.split(' ').filter(w => w.length >= 3);
          const heardTokens = normalizedHeard.split(' ').filter(w => w.length >= 3);

          const matchedWords = targetTokens.filter(tw => 
            heardTokens.some(hw => hw === tw || hw.includes(tw) || tw.includes(hw))
          );

          if (matchedWords.length >= 2 || (targetTokens.length <= 3 && matchedWords.length >= 1) || normalizedHeard.includes(normalizedTarget)) {
            recognizedSpeechPassed = true;
            manualStopRef.current = true;
            advancePipeline();
          }
        };

        recognition.onerror = (e) => {
          console.warn("Speech error:", e);
        };

        recognition.start();
      } catch (err) {
        console.warn('Speech recognition could not start:', err);
        setVoiceError('Could not start speech recognition. Use the Skip button.');
        stopMicrophoneEngine();
      }
    } else {
      setVoiceError('Speech Recognition is not supported on this browser.');
      stopMicrophoneEngine();
    }
  };

  // STEP 4: STRICT FULL-BODY DANCE MISSION (15-SECOND WINDOW & RETRY LOOP)
  const stopDanceEngine = () => {
    if (danceAnimRef.current) {
      cancelAnimationFrame(danceAnimRef.current);
      danceAnimRef.current = null;
    }
    if (danceStreamRef.current) {
      danceStreamRef.current.getTracks().forEach((track) => track.stop());
      danceStreamRef.current = null;
    }
    if (danceVideoRef.current) {
      danceVideoRef.current.srcObject = null;
    }
    if (danceAudioRef.current) {
      danceAudioRef.current.pause();
      danceAudioRef.current.currentTime = 0;
    }
    if (danceTimerIntervalRef.current) {
      clearInterval(danceTimerIntervalRef.current);
      danceTimerIntervalRef.current = null;
    }
    if (danceCanvasRef.current) {
      const canvasContext = danceCanvasRef.current.getContext('2d');
      canvasContext?.clearRect(0, 0, danceCanvasRef.current.width, danceCanvasRef.current.height);
    }
    previousFullBodyLandmarksRef.current = null;
  };

  const startDanceRound = (trackToPlay = null) => {
    // 1. Instantly mute background alarm tone
    stopMelodyLoop();
    setDanceFailed(false);
    setDanceTimeRemaining(15);
    danceScoreRef.current = 0;
    setDanceProgress(0);

    const targetSong = trackToPlay || DANCE_PLAYLIST.find(t => t.id === currentDanceTrackId) || DANCE_PLAYLIST[0];
    if (danceAudioRef.current) {
      danceAudioRef.current.pause();
    }

    // Direct, reliable audio player
    const audio = new Audio(targetSong.src);
    danceAudioRef.current = audio;
    audio.loop = true;
    audio.volume = Math.max(0.65, volume / 100);
    audio.play().catch((err) => {
      console.warn('Dance music play error, using fallback:', err);
      const fallbackAudio = new Audio(DANCE_PLAYLIST[0].src);
      danceAudioRef.current = fallbackAudio;
      fallbackAudio.loop = true;
      fallbackAudio.volume = Math.max(0.65, volume / 100);
      fallbackAudio.play().catch(() => {});
    });

    if (danceTimerIntervalRef.current) clearInterval(danceTimerIntervalRef.current);

    let timeLeft = 15;
    danceTimerIntervalRef.current = setInterval(() => {
      timeLeft -= 1;
      setDanceTimeRemaining(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(danceTimerIntervalRef.current);
        danceTimerIntervalRef.current = null;

        if (danceScoreRef.current < 100) {
          if (danceAudioRef.current) {
            danceAudioRef.current.pause();
          }
          setDanceFailed(true);
          setDanceStatus('⏰ 15s Time Up! Hit "Try Again" & dance faster!');
          startMelodyLoop(); // Alarm dobara bajna shuru
        }
      }
    }, 1000);
  };

  const handleTryAgainDance = () => {
    startDanceRound();
  };

  const switchDanceSong = (newTrackId) => {
    const matched = DANCE_PLAYLIST.find(t => t.id === newTrackId);
    if (!matched) return;
    setCurrentDanceTrackId(newTrackId);
    if (!danceFailed) {
      startDanceRound(matched);
    }
  };

  const startDanceMission = async () => {
    stopMelodyLoop();
    const randomSong = DANCE_PLAYLIST[Math.floor(Math.random() * DANCE_PLAYLIST.length)];
    setCurrentDanceTrackId(randomSong.id);
    startDanceRound(randomSong);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 360 } }
      });
      danceStreamRef.current = stream;

      const video = danceVideoRef.current;
      const canvas = danceCanvasRef.current;
      const canvasContext = canvas?.getContext('2d');
      if (!video || !canvas || !canvasContext) {
        throw new Error('Could not initialize the dance video overlay.');
      }

      video.srcObject = stream;
      video.setAttribute('playsinline', 'true');
      video.muted = true;
      await video.play();

      if (!poseLandmarkerRef.current) {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.45,
          minPosePresenceConfidence: 0.45,
          minTrackingConfidence: 0.45
        });
      }

      const connections = [
        [11, 12],
        [11, 13], [13, 15],
        [12, 14], [14, 16],
        [11, 23], [12, 24],
        [23, 24],
        [23, 25], [24, 26],
        [25, 27], [26, 28]
      ];
      let lastSampleTime = 0;

      const trackPose = (timestamp) => {
        if (!video || video.readyState < 2 || !poseLandmarkerRef.current) {
          danceAnimRef.current = requestAnimationFrame(trackPose);
          return;
        }

        if (timestamp - lastSampleTime >= 85) {
          lastSampleTime = timestamp;
          const result = poseLandmarkerRef.current.detectForVideo(video, timestamp);
          const landmarks = result?.landmarks?.[0];
          canvasContext.clearRect(0, 0, canvas.width, canvas.height);

          if (landmarks && landmarks.length > 0) {
            const scale = Math.max(canvas.width / (video.videoWidth || 320), canvas.height / (video.videoHeight || 240));
            const offsetX = ((video.videoWidth || 320) * scale - canvas.width) / 2;
            const offsetY = ((video.videoHeight || 240) * scale - canvas.height) / 2;

            const pointIsVisible = (index) => {
              const pt = landmarks[index];
              return pt && (pt.visibility ?? 1) >= 0.35;
            };

            const pointOnCanvas = (index) => {
              const pt = landmarks[index];
              return {
                x: pt.x * (video.videoWidth || 320) * scale - offsetX,
                y: pt.y * (video.videoHeight || 240) * scale - offsetY
              };
            };

            // Neon Skeleton Overlay
            canvasContext.lineWidth = 4;
            canvasContext.lineCap = 'round';
            canvasContext.strokeStyle = '#39ffcf';
            canvasContext.shadowColor = '#00ffc8';
            canvasContext.shadowBlur = 10;

            for (const [start, end] of connections) {
              if (!pointIsVisible(start) || !pointIsVisible(end)) continue;
              const from = pointOnCanvas(start);
              const to = pointOnCanvas(end);
              canvasContext.beginPath();
              canvasContext.moveTo(from.x, from.y);
              canvasContext.lineTo(to.x, to.y);
              canvasContext.stroke();
            }
            canvasContext.shadowBlur = 0;

            // Strict Full-Body Verification:
            const shouldersVisible = pointIsVisible(11) && pointIsVisible(12);
            const handsVisible = pointIsVisible(15) || pointIsVisible(16);
            const legsVisible = pointIsVisible(25) || pointIsVisible(26) || pointIsVisible(23) || pointIsVisible(24);

            if (!shouldersVisible || !legsVisible) {
              setDanceStatus('⚠️ Step Back! Knees and shoulders must be visible!');
              previousFullBodyLandmarksRef.current = null;
            } else if (!handsVisible) {
              setDanceStatus('🙌 Raise your arms and dance!');
              previousFullBodyLandmarksRef.current = null;
            } else {
              const trackedJoints = [11, 12, 15, 16, 23, 24, 25, 26].filter(pointIsVisible);

              const currentPoints = trackedJoints.map((idx) => ({
                idx,
                x: landmarks[idx].x,
                y: landmarks[idx].y
              }));

              const previousPoints = previousFullBodyLandmarksRef.current;

              if (previousPoints) {
                const prevMap = new Map(previousPoints.map((p) => [p.idx, p]));
                
                const handDeltas = currentPoints
                  .filter(p => (p.idx === 15 || p.idx === 16) && prevMap.has(p.idx))
                  .map(p => Math.hypot(p.x - prevMap.get(p.idx).x, p.y - prevMap.get(p.idx).y));

                const lowerBodyDeltas = currentPoints
                  .filter(p => (p.idx === 11 || p.idx === 12 || p.idx === 23 || p.idx === 24 || p.idx === 25 || p.idx === 26) && prevMap.has(p.idx))
                  .map(p => Math.hypot(p.x - prevMap.get(p.idx).x, p.y - prevMap.get(p.idx).y));

                const avgHandMotion = handDeltas.length ? handDeltas.reduce((a, b) => a + b, 0) / handDeltas.length : 0;
                const avgLowerBodyMotion = lowerBodyDeltas.length ? lowerBodyDeltas.reduce((a, b) => a + b, 0) / lowerBodyDeltas.length : 0;

                // Anti-Cheat Condition:
                if (avgLowerBodyMotion > 0.016 && avgHandMotion > 0.018) {
                  danceScoreRef.current = Math.min(100, danceScoreRef.current + 1.35);
                  setDanceStatus('🔥 Awesome Full Body Moves! Keep jumping!');
                } else if (avgHandMotion > 0.02 && avgLowerBodyMotion <= 0.016) {
                  setDanceStatus('❌ Move your legs/hips too! Don\'t just wave hands!');
                  danceScoreRef.current = Math.max(0, danceScoreRef.current - 0.2);
                } else {
                  danceScoreRef.current = Math.max(0, danceScoreRef.current - 0.2);
                  setDanceStatus('💃 Step & dance to the beat!');
                }

                const progress = Math.round(danceScoreRef.current);
                setDanceProgress(progress);

                if (danceScoreRef.current >= 100) {
                  setDanceProgress(100);
                  setDanceStatus('🎉 100% Passed! You are fully awake!');
                  stopDanceEngine();
                  advancePipeline();
                  return;
                }
              }
              previousFullBodyLandmarksRef.current = currentPoints;
            }
          } else {
            previousFullBodyLandmarksRef.current = null;
            setDanceStatus('Looking for body skeleton... Step back!');
          }
        }

        danceAnimRef.current = requestAnimationFrame(trackPose);
      };

      danceAnimRef.current = requestAnimationFrame(trackPose);
    } catch (err) {
      console.warn("Dance camera error:", err);
      setDanceStatus('Camera blocked! Please allow camera access.');
    }
  };

  const startStep = (stepName) => {
    if (stepName === 'math') {
      generateMathMission();
    } else if (stepName === 'eyes') {
      startEyeDetection();
    } else if (stepName === 'voice') {
      const randomPhrase = WAKE_PHRASES[Math.floor(Math.random() * WAKE_PHRASES.length)];
      setTargetVoicePhrase(randomPhrase);
      targetVoicePhraseRef.current = randomPhrase;
    } else if (stepName === 'dance') {
      startDanceMission();
    }
  };

  const advancePipeline = () => {
    stopCamera();
    stopMicrophoneEngine();
    stopDanceEngine();

    const currentPipe = activePipelineRef.current;
    const nextIdx = pipelineIndexRef.current + 1;

    if (nextIdx < currentPipe.length) {
      pipelineIndexRef.current = nextIdx;
      setPipelineIndex(nextIdx);
      const nextStep = currentPipe[nextIdx];
      if (nextStep === 'dance') {
        startStep(nextStep);
      } else {
        setTimeout(() => startStep(nextStep), 200);
      }
    } else {
      finalizeAlarmDismissal();
    }
  };

  const triggerAlarmRing = (info, note = '') => {
    setRingingAlarmInfo(info);
    setActiveRingingNote(note || alarmNote);

    const pipe = buildPipeline();
    activePipelineRef.current = pipe;
    pipelineIndexRef.current = 0;
    setActivePipeline(pipe);
    setPipelineIndex(0);

    setIsRinging(true);
    startMelodyLoop();

    if (pipe.length > 0) {
      startStep(pipe[0]);
    }
  };

  const handleVerifyMath = (e) => {
    e.preventDefault();
    if (parseInt(userAnswer, 10) === mathProblem.answer) {
      setMathError(false);
      advancePipeline();
    } else {
      setMathError(true);
    }
  };

  const finalizeAlarmDismissal = () => {
    stopMelodyLoop();
    stopCamera();
    stopMicrophoneEngine();
    stopDanceEngine();
    setIsRinging(false);
    setIsPlayingPreview(false);
    activePipelineRef.current = [];
    pipelineIndexRef.current = 0;
    setActivePipeline([]);
    setPipelineIndex(0);
    setTranscript('');
    setOpenEyesProgress(0);
    setVoiceVolumeLevel(0);
    setDanceProgress(0);
  };

  // Clock Angle Math
  const angleToTime = (deg) => {
    let normalized = ((deg % 360) + 360) % 360;
    let totalMinutes = Math.round((normalized / 360) * 12 * 60);
    let hrs = Math.floor(totalMinutes / 60);
    let mins = totalMinutes % 60;
    mins = Math.round(mins / 5) * 5;
    if (mins === 60) { mins = 0; hrs += 1; }
    hrs = hrs % 12;
    if (hrs === 0) hrs = 12;
    return `${String(hrs).padStart(2, '0')}.${String(mins).padStart(2, '0')}`;
  };

  useEffect(() => {
    const currentWakeTime = angleToTime(wakeAngle);
    setAlarms((prev) =>
      prev.map((a) => (a.isDialSync ? { ...a, time: currentWakeTime, active: alarmEnabled, note: alarmNote } : a))
    );
  }, [wakeAngle, alarmEnabled, alarmNote]);

  const toggleAlarm = (id) => {
    setAlarms((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const updated = !a.active;
          if (a.isDialSync) setAlarmEnabled(updated);
          return { ...a, active: updated };
        }
        return a;
      })
    );
  };

  const deleteAlarm = (id) => {
    setAlarms((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddNewAlarm = (e) => {
    e.preventDefault();
    if (!newAlarmTime) return;
    const [h, m] = newAlarmTime.split(':');
    let hrs = parseInt(h, 10) % 12;
    if (hrs === 0) hrs = 12;
    setAlarms((prev) => [
      ...prev,
      {
        id: Date.now(),
        time: `${String(hrs).padStart(2, '0')}.${m}`,
        label: newAlarmLabel || 'Custom Alarm',
        note: newAlarmCustomNote || 'Time to wake up!',
        active: true,
        isDialSync: false
      }
    ]);
    setIsAddModalOpen(false);
    setNewAlarmCustomNote('');
  };

  // Real-time Clock Monitor
  useEffect(() => {
    const checkAlarmTime = () => {
      if (isRinging) return;
      const now = new Date();
      let currentHrs = now.getHours() % 12;
      if (currentHrs === 0) currentHrs = 12;
      const currentTimeStr = `${String(currentHrs).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}`;

      if (now.getSeconds() === 0) {
        const match = alarms.find((a) => a.active && a.time === currentTimeStr);
        if (match) triggerAlarmRing(`${match.time} (${match.label})`, match.note);
      }
    };
    const timer = setInterval(checkAlarmTime, 1000);
    return () => clearInterval(timer);
  }, [alarms, isRinging, enabledMissions, alarmNote]);

  const calculateSleepDuration = useCallback(() => {
    let diffDeg = wakeAngle - bedAngle;
    if (diffDeg < 0) diffDeg += 360;
    let totalMinutes = Math.round((diffDeg / 360) * 12 * 60);
    let hrs = Math.floor(totalMinutes / 60);
    let mins = totalMinutes % 60;
    mins = Math.round(mins / 5) * 5;
    if (mins === 60) { mins = 0; hrs += 1; }
    return { hrs: String(hrs).padStart(2, '0'), mins: String(mins).padStart(2, '0') };
  }, [bedAngle, wakeAngle]);

  const handleMove = useCallback((clientX, clientY) => {
    if (!activeHandle || !dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    let theta = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (theta < 0) theta += 360;
    if (activeHandle === 'bed') setBedAngle(theta);
    else if (activeHandle === 'wake') setWakeAngle(theta);
  }, [activeHandle]);

  useEffect(() => {
    const onMouseMove = (e) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e) => {
      if (e.touches.length > 0) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onEnd = () => setActiveHandle(null);

    if (activeHandle) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onEnd);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [activeHandle, handleMove]);

  // Mini Calendar Helper for Page 1
  const renderMiniCalendar = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const todayDay = now.getDay();
    const todayDate = now.getDate();

    const weekDates = [];
    for (let i = -3; i <= 3; i++) {
      const d = new Date();
      d.setDate(todayDate + i);
      weekDates.push({
        dayName: days[d.getDay()],
        dateNum: d.getDate(),
        isToday: i === 0
      });
    }

    return (
      <div style={{
        backgroundColor: '#1b0633',
        border: '1px solid #37145b',
        borderRadius: '16px',
        padding: '8px 10px',
        display: 'flex',
        justifyContent: 'space-between',
        width: '100%',
        boxSizing: 'border-box',
        margin: '6px 0'
      }}>
        {weekDates.map((item, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '4px 6px',
              borderRadius: '10px',
              backgroundColor: item.isToday ? '#ff1b90' : 'transparent',
              color: item.isToday ? '#fff' : '#8d72b2',
              boxShadow: item.isToday ? '0 0 10px rgba(255, 27, 144, 0.6)' : 'none'
            }}
          >
            <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>{item.dayName}</span>
            <span style={{ fontSize: '13px', fontWeight: 900, marginTop: '2px' }}>{item.dateNum}</span>
          </div>
        ))}
      </div>
    );
  };

  const sleepDuration = calculateSleepDuration();

  const getSoundDisplayName = () => {
    if (selectedSound === 'custom') return '🎵 Custom MP3';
    const found = DEFAULT_SOUNDS.find((s) => s.id === selectedSound);
    return found ? found.name.split(' ')[1] || found.name : 'Chicken';
  };

  const currentActiveStepName = activePipeline[pipelineIndex] || null;

  return (
    <div style={{
      minHeight: '100dvh',
      width: '100vw',
      backgroundColor: '#0a0214',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: 0,
      padding: 0,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      boxSizing: 'border-box',
      userSelect: 'none',
      overflowX: 'hidden'
    }}>

      {/* ==================== ACTIVE ALARM RINGING SCREEN ==================== */}
      {isRinging && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(10, 2, 20, 0.96)',
          backdropFilter: 'blur(14px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'max(10px, env(safe-area-inset-top)) 12px max(10px, env(safe-area-inset-bottom))'
        }}>
          <div style={{
            boxSizing: 'border-box',
            width: '100%',
            maxWidth: '380px',
            backgroundColor: '#1b0633',
            border: '2px solid #ff1b90',
            borderRadius: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 0 60px rgba(255, 27, 144, 0.8)',
            textAlign: 'center',
            color: '#fff',
            position: 'relative',
            maxHeight: 'calc(100dvh - 24px)',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            padding: 'clamp(14px, 4vw, 22px) clamp(14px, 4vw, 20px)'
          }}>
            {activePipeline.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center', marginBottom: '12px' }}>
                {activePipeline.map((step, idx) => (
                  <div
                    key={step}
                    style={{
                      flex: 1,
                      height: '4px',
                      borderRadius: '2px',
                      backgroundColor: idx <= pipelineIndex ? '#ff1b90' : '#3d1768'
                    }}
                  />
                ))}
              </div>
            )}

            {activeRingingNote && (
              <div style={{
                width: '100%',
                backgroundColor: 'rgba(255, 27, 144, 0.15)',
                border: '2px dashed #ff1b90',
                borderRadius: '16px',
                padding: '10px 14px',
                boxSizing: 'border-box',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                textAlign: 'left'
              }}>
                <FileText size={20} color="#ff79c6" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#ff79c6', fontWeight: 800, letterSpacing: '0.5px' }}>
                    Your Wake-Up Goal
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                    "{activeRingingNote}"
                  </div>
                </div>
              </div>
            )}

            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: '#ff1b90',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px #ff1b90',
              marginBottom: '8px'
            }}>
              <BellRing size={26} color="#fff" />
            </div>

            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#ff79c6', fontWeight: 800 }}>
              {activePipeline.length > 0 ? `Mission ${pipelineIndex + 1} of ${activePipeline.length}` : 'Alarm Ringing'}
            </span>

            {/* STEP 1: MATH */}
            {currentActiveStepName === 'math' && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
                <h3 style={{ fontSize: '19px', fontWeight: 900, margin: 0 }}>Solve Math Problem</h3>
                <p style={{ fontSize: '11px', color: '#c7a9e9', margin: 0 }}>
                  Solve calculation to unlock next step!
                </p>

                <form onSubmit={handleVerifyMath} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    backgroundColor: '#270e44',
                    border: mathError ? '2px solid #ef4444' : '2px solid #ff1b90',
                    borderRadius: '18px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '2px', color: '#fff' }}>
                        {mathProblem.question} = ?
                      </span>
                      <button
                        type="button"
                        onClick={generateMathMission}
                        style={{ background: 'none', border: 'none', color: '#c7a9e9', cursor: 'pointer' }}
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>

                    <input
                      type="number"
                      placeholder="Enter answer"
                      value={userAnswer}
                      onChange={(e) => { setUserAnswer(e.target.value); setMathError(false); }}
                      autoFocus
                      style={{
                        width: '140px',
                        textAlign: 'center',
                        padding: '10px',
                        borderRadius: '12px',
                        border: '1px solid #4a1e7d',
                        backgroundColor: '#16042b',
                        color: '#fff',
                        fontSize: '18px',
                        fontWeight: 800,
                        outline: 'none'
                      }}
                    />
                    {mathError && <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>Incorrect answer!</span>}
                  </div>

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '14px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #ff1a8c, #c40b68)',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    Submit Answer <ChevronRight size={16} />
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2: BOTH EYES */}
            {currentActiveStepName === 'eyes' && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <h3 style={{ fontSize: '19px', fontWeight: 900, margin: 0 }}>Open BOTH Eyes</h3>
                <p style={{ fontSize: '11px', color: '#c7a9e9', margin: 0 }}>
                  Keep both eyes wide open for 1.5s!
                </p>

                <div style={{
                  position: 'relative',
                  width: '170px',
                  height: '170px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: openEyesProgress > 60 ? '3px solid #10b981' : '3px solid #ff1b90',
                  boxShadow: openEyesProgress > 60 ? '0 0 25px rgba(16, 185, 129, 0.6)' : '0 0 25px rgba(255, 27, 144, 0.6)',
                  backgroundColor: '#000'
                }}>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                  />
                </div>

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700 }}>
                    <span style={{ color: openEyesProgress > 70 ? '#10b981' : '#ff79c6' }}>{eyesOpenStatus}</span>
                    <span>{openEyesProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#270e44', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${openEyesProgress}%`,
                      height: '100%',
                      background: openEyesProgress > 70 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #ff1a8c, #c40b68)',
                      transition: 'width 0.1s linear'
                    }} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: STRICT VOICE PHRASE */}
            {currentActiveStepName === 'voice' && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                <h3 style={{ fontSize: '19px', fontWeight: 900, margin: 0 }}>Speak Exact Phrase!</h3>
                <p style={{ fontSize: '11px', color: '#c7a9e9', margin: 0 }}>
                  Tap mic and speak this complete sentence to proceed:
                </p>

                <div style={{
                  backgroundColor: '#270e44',
                  border: '2px dashed #ff1b90',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffd0eb', fontStyle: 'italic', lineHeight: 1.4 }}>
                    "{targetVoicePhrase}"
                  </span>
                </div>

                {isListening && (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#c7a9e9', fontWeight: 600 }}>
                      <span>Mic Sound Level</span>
                      <span>{voiceVolumeLevel}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#270e44', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${voiceVolumeLevel}%`,
                        height: '100%',
                        backgroundColor: voiceVolumeLevel > 30 ? '#10b981' : '#ff1b90',
                        transition: 'width 0.05s ease'
                      }} />
                    </div>
                  </div>
                )}

                {transcript && (
                  <div style={{ fontSize: '12px', color: '#c7a9e9' }}>
                    Heard: <strong style={{ color: '#fff' }}>"{transcript}"</strong>
                  </div>
                )}

                {voiceError && <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>{voiceError}</span>}

                <button
                  type="button"
                  onClick={handleStartVoiceRecognition}
                  disabled={isListening}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '14px',
                    border: 'none',
                    background: isListening ? '#f59e0b' : 'linear-gradient(135deg, #ff1a8c, #c40b68)',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: 800,
                    cursor: isListening ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: isListening ? '0 0 20px #f59e0b' : '0 8px 20px rgba(255,26,140,0.4)'
                  }}
                >
                  <Mic size={18} /> {isListening ? 'Listening... Speak Sentence Now!' : 'Tap Mic & Read Phrase'}
                </button>

                {/* SKIP / FORCE COMPLETE BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    manualStopRef.current = true;
                    advancePipeline();
                  }}
                  style={{
                    width: '100%',
                    padding: '13px',
                    borderRadius: '14px',
                    border: '2px solid #ffd166',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 8px 20px rgba(245,158,11,0.4)'
                  }}
                >
                  Skip / Force Complete Phrase
                </button>
              </div>
            )}

            {/* STEP 4: STRICT FULL-BODY DANCE MISSION */}
            {currentActiveStepName === 'dance' && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 900, margin: 0 }}>💃 Morning Dance Mission</h3>

                {/* 15S COUNTDOWN HEADER & SONG SELECTOR */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  backgroundColor: danceFailed ? '#ef4444' : '#270e44',
                  border: danceFailed ? '1px solid #ef4444' : '1px solid #ff1b90',
                  borderRadius: '12px',
                  padding: '6px 10px',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff' }}>
                    {danceFailed ? '🚨 15s Up! Alarm Ringing!' : `⏱️ Time Left: ${danceTimeRemaining}s`}
                  </div>

                  <select
                    value={currentDanceTrackId}
                    onChange={(e) => switchDanceSong(e.target.value)}
                    disabled={danceFailed}
                    style={{
                      background: '#1b0633',
                      border: '1px solid #ff1b90',
                      borderRadius: '8px',
                      color: '#ffd0eb',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {DANCE_PLAYLIST.map((trk) => (
                      <option key={trk.id} value={trk.id} style={{ backgroundColor: '#1b0633', color: '#fff' }}>
                        {trk.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{
                  position: 'relative',
                  width: 'min(100%, 270px)',
                  aspectRatio: '3 / 4',
                  maxHeight: '40svh',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  border: danceProgress > 70 ? '3px solid #10b981' : '3px solid #ff1b90',
                  boxShadow: danceProgress > 70 ? '0 0 30px rgba(16, 185, 129, 0.7)' : '0 0 30px rgba(255, 27, 144, 0.7)',
                  backgroundColor: '#000'
                }}>
                  <video
                    ref={danceVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: 'scaleX(-1)'
                    }}
                  />
                  <canvas
                    ref={danceCanvasRef}
                    width={360}
                    height={480}
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                      transform: 'scaleX(-1)'
                    }}
                  />

                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    fontWeight: 800,
                    color: '#ff79c6'
                  }}>
                    <Activity size={12} color="#ff1b90" />
                    <span>{danceProgress}%</span>
                  </div>
                </div>

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700 }}>
                    <span style={{ color: danceFailed ? '#ef4444' : (danceProgress > 70 ? '#10b981' : '#ff79c6') }}>
                      {danceStatus}
                    </span>
                    <span>{danceProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#270e44', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${danceProgress}%`,
                      height: '100%',
                      background: danceProgress > 70 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #ff1a8c, #c40b68)',
                      transition: 'width 0.15s ease'
                    }} />
                  </div>
                </div>

                {/* TRY AGAIN BUTTON */}
                {danceFailed && (
                  <button
                    type="button"
                    onClick={handleTryAgainDance}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '14px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff',
                      fontSize: '14px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: '0 8px 20px rgba(16, 185, 129, 0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginTop: '4px'
                    }}
                  >
                    <RefreshCw size={16} /> Try Again (Pause Alarm & Dance)
                  </button>
                )}
              </div>
            )}

            {activePipeline.length === 0 && (
              <div style={{ width: '100%', marginTop: '12px' }}>
                <button
                  onClick={finalizeAlarmDismissal}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '16px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #ff1a8c, #c40b68)',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Dismiss Alarm
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MISSION CUSTOMIZER MODAL ==================== */}
      {isMissionConfigOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(10, 2, 20, 0.88)',
          backdropFilter: 'blur(8px)',
          zIndex: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '320px',
            backgroundColor: '#1b0633',
            border: '2px solid #ff1b90',
            borderRadius: '28px',
            padding: '22px',
            boxShadow: '0 20px 50px rgba(255, 27, 144, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            color: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={20} color="#ff1b90" />
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Wake-Up Missions</h3>
              </div>
              <X size={20} color="#8d72b2" cursor="pointer" onClick={() => setIsMissionConfigOpen(false)} />
            </div>

            <p style={{ fontSize: '11px', color: '#c7a9e9', margin: 0 }}>
              Choose which verification steps must be cleared to silence the alarm:
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#270e44',
              padding: '10px 12px',
              borderRadius: '16px',
              border: enabledMissions.math ? '1px solid #ff1b90' : '1px solid #3d1768'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800 }}>🧮 1. Math Challenge</div>
                <div style={{ fontSize: '10px', color: '#8d72b2' }}>Arithmetic calculation</div>
              </div>
              <input
                type="checkbox"
                checked={enabledMissions.math}
                onChange={(e) => setEnabledMissions({ ...enabledMissions, math: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#ff1b90', cursor: 'pointer' }}
              />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#270e44',
              padding: '10px 12px',
              borderRadius: '16px',
              border: enabledMissions.eyes ? '1px solid #ff1b90' : '1px solid #3d1768'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800 }}>👁️ 2. Both Eyes Open AI</div>
                <div style={{ fontSize: '10px', color: '#8d72b2' }}>Requires eyes open 1.5s</div>
              </div>
              <input
                type="checkbox"
                checked={enabledMissions.eyes}
                onChange={(e) => setEnabledMissions({ ...enabledMissions, eyes: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#ff1b90', cursor: 'pointer' }}
              />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#270e44',
              padding: '10px 12px',
              borderRadius: '16px',
              border: enabledMissions.voice ? '1px solid #ff1b90' : '1px solid #3d1768'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800 }}>🎙️ 3. Voice Passphrase</div>
                <div style={{ fontSize: '10px', color: '#8d72b2' }}>Speaks phrase to dismiss</div>
              </div>
              <input
                type="checkbox"
                checked={enabledMissions.voice}
                onChange={(e) => setEnabledMissions({ ...enabledMissions, voice: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#ff1b90', cursor: 'pointer' }}
              />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#270e44',
              padding: '10px 12px',
              borderRadius: '16px',
              border: enabledMissions.dance ? '1px solid #ff1b90' : '1px solid #3d1768'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800 }}>💃 4. Morning Dance (15s)</div>
                <div style={{ fontSize: '10px', color: '#8d72b2' }}>Full body movement & auto song</div>
              </div>
              <input
                type="checkbox"
                checked={enabledMissions.dance}
                onChange={(e) => setEnabledMissions({ ...enabledMissions, dance: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#ff1b90', cursor: 'pointer' }}
              />
            </div>

            <button
              onClick={() => setIsMissionConfigOpen(false)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #ff1a8c, #c40b68)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                marginTop: '4px'
              }}
            >
              Done & Save
            </button>
          </div>
        </div>
      )}

      {/* ==================== SOUND SELECTOR MODAL ==================== */}
      {isSoundSelectorOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(10, 2, 20, 0.88)',
          backdropFilter: 'blur(8px)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '320px',
            backgroundColor: '#1b0633',
            border: '2px solid #3d1768',
            borderRadius: '28px',
            padding: '20px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            color: '#fff',
            maxHeight: '85vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Music size={18} color="#ff1b90" />
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Choose Alarm Sound</h3>
              </div>
              <X size={20} color="#8d72b2" cursor="pointer" onClick={() => setIsSoundSelectorOpen(false)} />
            </div>

            <div style={{
              border: '2px dashed #ff1b90',
              borderRadius: '16px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#270e44',
              cursor: 'pointer'
            }}
            onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={20} color="#ff1b90" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                {customAudioData ? 'Change Custom Song' : '+ Upload Your Own MP3'}
              </span>
              <span style={{ fontSize: '10px', color: '#c7a9e9' }}>Any song or meme audio</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>

            {customAudioData && (
              <div
                onClick={() => handleSelectSound('custom')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '14px',
                  backgroundColor: selectedSound === 'custom' ? '#ff1b90' : '#270e44',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontWeight: 700,
                  fontSize: '13px'
                }}
              >
                <span>⭐ My Custom Uploaded Song</span>
                {selectedSound === 'custom' && <Check size={16} />}
              </div>
            )}

            <div style={{ fontSize: '11px', color: '#ff79c6', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
              Folder Prank & Meme Sounds
            </div>

            {DEFAULT_SOUNDS.filter(s => s.category === 'prank').map((sound) => (
              <div
                key={sound.id}
                onClick={() => handleSelectSound(sound.id)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '14px',
                  backgroundColor: selectedSound === sound.id ? '#ff1b90' : '#270e44',
                  border: '1px solid #3d1768',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                <span>{sound.name}</span>
                {selectedSound === sound.id && <Check size={16} />}
              </div>
            ))}

            <div style={{ fontSize: '11px', color: '#a58ec4', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
              5 Standard Ringtones
            </div>

            {DEFAULT_SOUNDS.filter(s => s.category === 'default').map((sound) => (
              <div
                key={sound.id}
                onClick={() => handleSelectSound(sound.id)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '14px',
                  backgroundColor: selectedSound === sound.id ? '#ff1b90' : '#270e44',
                  border: '1px solid #3d1768',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                <span>{sound.name}</span>
                {selectedSound === sound.id && <Check size={16} />}
              </div>
            ))}

            <div style={{ fontSize: '11px', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
              5 Soft & Relaxing Sounds
            </div>

            {DEFAULT_SOUNDS.filter(s => s.category === 'relaxing').map((sound) => (
              <div
                key={sound.id}
                onClick={() => handleSelectSound(sound.id)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '14px',
                  backgroundColor: selectedSound === sound.id ? '#ff1b90' : '#270e44',
                  border: '1px solid #3d1768',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                <span>{sound.name}</span>
                {selectedSound === sound.id && <Check size={16} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== ADD ALARM MODAL ==================== */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(10, 2, 20, 0.8)',
          backdropFilter: 'blur(6px)',
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <form
            onSubmit={handleAddNewAlarm}
            style={{
              width: '100%',
              maxWidth: '300px',
              backgroundColor: '#1b0633',
              border: '2px solid #3d1768',
              borderRadius: '28px',
              padding: '24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              color: '#fff'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>New Alarm</h3>
              <X size={20} color="#8d72b2" cursor="pointer" onClick={() => setIsAddModalOpen(false)} />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#c7a9e9', display: 'block', marginBottom: '6px' }}>Time</label>
              <input
                type="time"
                value={newAlarmTime}
                onChange={(e) => setNewAlarmTime(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: '#270e44',
                  border: '1px solid #4a1e7d',
                  color: '#fff',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#c7a9e9', display: 'block', marginBottom: '6px' }}>Label / Days</label>
              <input
                type="text"
                placeholder="e.g. Work, Gym, Sat-Sun"
                value={newAlarmLabel}
                onChange={(e) => setNewAlarmLabel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: '#270e44',
                  border: '1px solid #4a1e7d',
                  color: '#fff',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#ff79c6', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                Wake-Up Note / Reason
              </label>
              <input
                type="text"
                placeholder="e.g. Flight at 8 AM / Gym day!"
                value={newAlarmCustomNote}
                onChange={(e) => setNewAlarmCustomNote(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  backgroundColor: '#270e44',
                  border: '1px solid #ff1b90',
                  color: '#fff',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #ff1a8c, #c40b68)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '6px',
                boxShadow: '0 6px 18px rgba(255,26,140,0.4)'
              }}
            >
              Add Alarm
            </button>
          </form>
        </div>
      )}

      {/* ==================== 2-PAGE MOBILE CARD FRAME ==================== */}
      <div style={{
        width: '100%',
        maxWidth: '410px',
        minHeight: '100dvh',
        backgroundColor: '#120324',
        padding: '18px 18px 12px 18px',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        {/* ================= PAGE 1: SLEEP TIME ================= */}
        {activeTab === 'sleep' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '3px', opacity: 0.75 }}>
                <span style={{ width: '2.5px', height: '16px', backgroundColor: '#a58ec4', borderRadius: '4px', transform: 'skewX(-15deg)' }} />
                <span style={{ width: '2.5px', height: '16px', backgroundColor: '#a58ec4', borderRadius: '4px', transform: 'skewX(-15deg)' }} />
                <span style={{ width: '2.5px', height: '16px', backgroundColor: '#a58ec4', borderRadius: '4px', transform: 'skewX(-15deg)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '0.4px' }}>CogniWake</h2>
                {syncStatus === 'saving' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />}
                {syncStatus === 'synced' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />}
              </div>
              <span
                onClick={() => triggerAlarmRing('CogniWake Mission', alarmNote)}
                style={{ fontSize: '13px', color: '#ff1b90', fontWeight: 800, cursor: 'pointer' }}
              >
                Test Ring
              </span>
            </div>

            {/* Dial with Exact Center & Handle Math */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '8px 0' }}>
              <div ref={dialRef} style={{ position: 'relative', width: '190px', height: '190px', display: 'flex', alignItems: 'center', justifyContent: 'center', touchAction: 'none' }}>
                <div style={{ position: 'absolute', inset: '10px', borderRadius: '50%', border: '12px solid #230a40', boxSizing: 'border-box' }} />

                <svg 
                  style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    width: '100%', 
                    height: '100%', 
                    transform: `rotate(${bedAngle - 90}deg)`, 
                    transformOrigin: '95px 95px',
                    pointerEvents: 'none' 
                  }} 
                  viewBox="0 0 190 190"
                >
                  <defs>
                    <linearGradient id="neonPink" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ff1b90" />
                      <stop offset="100%" stopColor="#d81075" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="95"
                    cy="95"
                    r="84"
                    fill="none"
                    stroke="url(#neonPink)"
                    strokeWidth="12"
                    strokeDasharray={2 * Math.PI * 84}
                    strokeDashoffset={(2 * Math.PI * 84) - (((wakeAngle - bedAngle + 360) % 360) / 360) * (2 * Math.PI * 84)}
                    strokeLinecap="round"
                    style={{ filter: 'drop-shadow(0 0 10px rgba(255, 27, 144, 0.9))' }}
                  />
                </svg>

                <div style={{
                  width: '118px',
                  height: '118px',
                  backgroundColor: '#ffffff',
                  borderRadius: '50%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.1)',
                  pointerEvents: 'none'
                }}>
                  <span style={{ position: 'absolute', top: '7px', fontSize: '9px', fontWeight: 800, color: '#666' }}>12</span>
                  <span style={{ position: 'absolute', right: '9px', fontSize: '9px', fontWeight: 800, color: '#666' }}>3</span>
                  <span style={{ position: 'absolute', bottom: '7px', fontSize: '9px', fontWeight: 800, color: '#666' }}>▲</span>
                  <span style={{ position: 'absolute', left: '9px', fontSize: '9px', fontWeight: 800, color: '#666' }}>9</span>

                  <div style={{ fontSize: '26px', fontWeight: 900, color: '#120324', lineHeight: 1, letterSpacing: '-0.5px' }}>
                    {sleepDuration.hrs}<span style={{ fontSize: '13px', fontWeight: 700, color: '#555', marginLeft: '2px' }}>hr</span>
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#888', marginTop: '2px' }}>
                    {sleepDuration.mins} min
                  </div>
                </div>

                {/* Bed Handle */}
                <div
                  onMouseDown={() => setActiveHandle('bed')}
                  onTouchStart={() => setActiveHandle('bed')}
                  style={{
                    position: 'absolute',
                    left: `${95 + 84 * Math.cos((bedAngle - 90) * (Math.PI / 180))}px`,
                    top: `${95 + 84 * Math.sin((bedAngle - 90) * (Math.PI / 180))}px`,
                    transform: 'translate(-50%, -50%)',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    border: '2px solid #ff1b90',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 12px rgba(255, 27, 144, 0.8)',
                    cursor: 'grab',
                    zIndex: 10
                  }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#120324' }} />
                </div>

                {/* Wake Handle */}
                <div
                  onMouseDown={() => setActiveHandle('wake')}
                  onTouchStart={() => setActiveHandle('wake')}
                  style={{
                    position: 'absolute',
                    left: `${95 + 84 * Math.cos((wakeAngle - 90) * (Math.PI / 180))}px`,
                    top: `${95 + 84 * Math.sin((wakeAngle - 90) * (Math.PI / 180))}px`,
                    transform: 'translate(-50%, -50%)',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: '#ff1b90',
                    border: '2px solid #ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 12px rgba(255, 27, 144, 0.8)',
                    cursor: 'grab',
                    zIndex: 10
                  }}
                >
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ffffff' }} />
                </div>
              </div>

              {/* Bedtime & Wake Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', marginTop: '10px' }}>
                <div style={{
                  position: 'relative',
                  background: 'linear-gradient(135deg, #ff1a8c 0%, #c40b68 100%)',
                  padding: '12px 10px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 6px 20px rgba(255, 26, 140, 0.4)'
                }}>
                  <span style={{ fontSize: '10px', color: '#ffd0eb', fontWeight: 600 }}>BedTime</span>
                  <span style={{ fontSize: '18px', fontWeight: 800 }}>{angleToTime(bedAngle)}</span>
                </div>

                <div style={{
                  position: 'relative',
                  backgroundColor: '#1e0935',
                  border: '1px solid #37145b',
                  padding: '12px 10px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '10px', color: '#8d72b2', fontWeight: 600 }}>Wake up</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#eeeeee' }}>{angleToTime(wakeAngle)}</span>
                </div>
              </div>
            </div>

            {/* NEW: WEEKLY MINI CALENDAR STRIP */}
            {renderMiniCalendar()}

            {/* Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
              
              <div 
                onClick={() => setIsMissionConfigOpen(true)}
                style={{
                  backgroundColor: '#200938',
                  border: '1px solid #3d1768',
                  borderRadius: '14px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Flame size={15} color="#ff1b90" />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffd0eb' }}>Missions Settings</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#a58ec4' }}>
                  <span>{buildPipeline().length} Active</span>
                  <ChevronRight size={13} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#e0d5ed' }}>Set alarm</span>
                <div
                  onClick={() => setAlarmEnabled(!alarmEnabled)}
                  style={{
                    width: '42px',
                    height: '24px',
                    borderRadius: '12px',
                    backgroundColor: alarmEnabled ? '#ff1b90' : '#270e44',
                    boxShadow: alarmEnabled ? '0 0 10px rgba(255, 27, 144, 0.6)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '2px',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    justifyContent: alarmEnabled ? 'flex-end' : 'flex-start',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ffffff' }} />
                </div>
              </div>

              {/* Sound & Slider */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#8d72b2', fontWeight: 600 }}>
                  <div 
                    onClick={() => setIsSoundSelectorOpen(true)}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#ff79c6' }}
                  >
                    <span>Sound: <strong>{getSoundDisplayName()}</strong></span>
                    <ChevronRight size={13} />
                  </div>
                  <button
                    onClick={handleTogglePreview}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: isPlayingPreview ? '#ff1b90' : '#fff',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: 0
                    }}
                  >
                    {isPlayingPreview ? <Volume2 size={13} color="#ff1b90" /> : <VolumeX size={13} color="#8d72b2" />}
                    <span>{isPlayingPreview ? 'Stop' : 'Preview'}</span>
                  </button>
                </div>

                <div style={{ position: 'relative', width: '100%', height: '6px', backgroundColor: '#270e44', borderRadius: '3px', display: 'flex', alignItems: 'center' }}>
                  <div style={{ height: '100%', width: `${volume}%`, background: 'linear-gradient(90deg, #d81075, #ff1b90)', borderRadius: '3px' }} />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => handleVolumeChange(e.target.value)}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                  />
                  <div style={{
                    position: 'absolute',
                    left: `${volume}%`,
                    transform: 'translateX(-50%)',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: '#ff1b90',
                    border: '2px solid #ffffff',
                    boxShadow: '0 0 8px rgba(255, 27, 144, 0.8)',
                    pointerEvents: 'none'
                  }} />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ================= PAGE 2: ALARMS LIST & SETTINGS ================= */}
        {activeTab === 'alarms' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '3px', opacity: 0.75 }}>
                <span style={{ width: '2.5px', height: '16px', backgroundColor: '#a58ec4', borderRadius: '4px', transform: 'skewX(-15deg)' }} />
                <span style={{ width: '2.5px', height: '16px', backgroundColor: '#a58ec4', borderRadius: '4px', transform: 'skewX(-15deg)' }} />
                <span style={{ width: '2.5px', height: '16px', backgroundColor: '#a58ec4', borderRadius: '4px', transform: 'skewX(-15deg)' }} />
              </div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '0.4px' }}>Alarms</h2>
              <button
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  background: 'rgba(255, 27, 144, 0.15)',
                  border: '1px solid rgba(255, 27, 144, 0.4)',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#ff1b90'
                }}
              >
                <Plus size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '14px 0' }}>
              <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #fbcfe8 0%, #e879f9 50%, #c084fc 100%)',
                  boxShadow: '0 0 35px rgba(232, 121, 249, 0.65)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: '16px', left: '20px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'rgba(217, 70, 239, 0.3)' }} />
                  <div style={{ position: 'absolute', bottom: '16px', right: '22px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(217, 70, 239, 0.25)' }} />
                  <div style={{ position: 'absolute', top: '-15px', left: '-15px', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#120324' }} />
                </div>
              </div>

              <span style={{ fontSize: '11px', color: '#8d72b2', fontWeight: 600, marginTop: '4px' }}>Total Target Sleep</span>
              <div style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.5px', marginTop: '2px' }}>
                {sleepDuration.hrs}<span style={{ fontSize: '14px', fontWeight: 700, color: '#bbb' }}>hr</span> {sleepDuration.mins}<span style={{ fontSize: '14px', fontWeight: 700, color: '#bbb' }}>min</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '4px', paddingRight: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#8d72b2' }}>Configured Alarms</span>
                <span style={{ fontSize: '11px', color: '#ff1b90', fontWeight: 800, cursor: 'pointer' }} onClick={() => setIsAddModalOpen(true)}>+ Add New</span>
              </div>

              {alarms.map((alarm) => (
                <div
                  key={alarm.id}
                  style={{
                    backgroundColor: '#1e0935',
                    border: '1px solid #37145b',
                    borderRadius: '16px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: alarm.active ? '#ffffff' : '#73618a' }}>{alarm.time}</div>
                    <div style={{ fontSize: '10px', color: '#ff79c6', fontWeight: 700 }}>{alarm.note || alarm.label}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {!alarm.isDialSync && (
                      <button onClick={() => deleteAlarm(alarm.id)} style={{ background: 'none', border: 'none', color: '#654f7a', cursor: 'pointer' }}>
                        <Trash2 size={15} />
                      </button>
                    )}
                    <div
                      onClick={() => toggleAlarm(alarm.id)}
                      style={{
                        width: '40px',
                        height: '22px',
                        borderRadius: '11px',
                        backgroundColor: alarm.active ? '#ff1b90' : '#140428',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '2px',
                        boxSizing: 'border-box',
                        cursor: 'pointer',
                        justifyContent: alarm.active ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#ffffff' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= BOTTOM BAR (PAGE 1 & 2 SWITCHER) ================= */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          paddingTop: '10px',
          borderTop: '1px solid #2b124a',
          marginTop: '10px',
          position: 'relative',
          zIndex: 5
        }}>
          <button
            onClick={() => setActiveTab('sleep')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              color: activeTab === 'sleep' ? '#ff1b90' : '#8d72b2',
              cursor: 'pointer'
            }}
          >
            <Moon size={19} />
            <span style={{ fontSize: '11px', fontWeight: 700 }}>Sleep</span>
          </button>
          
          <button
            onClick={() => setActiveTab('alarms')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              color: activeTab === 'alarms' ? '#ff1b90' : '#8d72b2',
              cursor: 'pointer'
            }}
          >
            <Bell size={19} />
            <span style={{ fontSize: '11px', fontWeight: 700 }}>Alarms</span>
          </button>
        </div>

      </div>

    </div>
  );
}