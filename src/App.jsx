import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ChevronRight, Volume2, VolumeX, BellRing, Plus, Trash2, X, Check, 
  RefreshCw, Moon, Bell, Camera, Mic, Upload, Music, Flame, FileText, Activity,
  Play, Pause, RotateCcw, Leaf, Sun, BarChart2, Compass, Sliders, Sparkles, Clock, Flag
} from 'lucide-react';
import { FilesetResolver, FaceLandmarker, PoseLandmarker } from '@mediapipe/tasks-vision';
import { supabase } from './supabase';

const LOCAL_STORAGE_KEY = 'cogniwake_alarm_state_v18_mint';
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

// 22 Default Sounds
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

  { id: 'melodian', name: '🎵 Melodian Chime', type: 'synth', category: 'default' },
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
  const [bedAngle, setBedAngle] = useState(300); // ~10:00 PM default
  const [wakeAngle, setWakeAngle] = useState(182.5); // ~06:05 AM default (8h 05m)

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

  const [currentDanceTrackId, setCurrentDanceTrackId] = useState('bollywood');
  const [selectedSound, setSelectedSound] = useState('chicken_screaming');
  const [customAudioData, setCustomAudioData] = useState(null);
  const [isSoundSelectorOpen, setIsSoundSelectorOpen] = useState(false);

  // 4 Bottom Tabs: 'sleep', 'timer', 'stopwatch', 'alarms'
  const [activeTab, setActiveTab] = useState('sleep');
  const [syncStatus, setSyncStatus] = useState('synced');

  const [alarms, setAlarms] = useState([
    { id: 1, time: '06.05', label: 'Sat, Sun', note: 'Morning Jogging', active: true, isDialSync: true },
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

  // ------------------ COUNTDOWN TIMER STATE & CUSTOM PICKER ------------------
  const [timerDuration, setTimerDuration] = useState(25 * 60);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isCustomTimerModalOpen, setIsCustomTimerModalOpen] = useState(false);
  const [customTimerHours, setCustomTimerHours] = useState('1');
  const [customTimerMins, setCustomTimerMins] = useState('0');
  const timerIntervalRef = useRef(null);

  // ------------------ STOPWATCH / STUDY TRACKER STATE ------------------
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const stopwatchIntervalRef = useRef(null);
  const stopwatchStartTimeRef = useRef(0);

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

  // Step 4: Full-Body Dance Engine & 15-Sec Countdown Timer
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

  // Timer Countdown Logic
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setIsTimerRunning(false);
            triggerAlarmRing('Focus Timer Completed!', 'Time to stretch and rest!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  const handleSetTimerPreset = (mins) => {
    setIsTimerRunning(false);
    setTimerDuration(mins * 60);
    setTimerSecondsLeft(mins * 60);
  };

  const handleApplyCustomTimer = (e) => {
    e.preventDefault();
    const hrs = parseInt(customTimerHours, 10) || 0;
    const mins = parseInt(customTimerMins, 10) || 0;
    const totalSecs = (hrs * 3600) + (mins * 60);
    if (totalSecs > 0) {
      setIsTimerRunning(false);
      setTimerDuration(totalSecs);
      setTimerSecondsLeft(totalSecs);
      setIsCustomTimerModalOpen(false);
    }
  };

  const handleToggleTimer = () => {
    if (timerSecondsLeft === 0) {
      setTimerSecondsLeft(timerDuration);
    }
    setIsTimerRunning(!isTimerRunning);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setTimerSecondsLeft(timerDuration);
  };

  const formatTimerDisplay = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ------------------ STOPWATCH LOGIC ------------------
  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchStartTimeRef.current = Date.now() - stopwatchTime;
      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchTime(Date.now() - stopwatchStartTimeRef.current);
      }, 30);
    } else if (stopwatchIntervalRef.current) {
      clearInterval(stopwatchIntervalRef.current);
    }
    return () => {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    };
  }, [isStopwatchRunning]);

  const handleToggleStopwatch = () => {
    setIsStopwatchRunning(!isStopwatchRunning);
  };

  const handleResetStopwatch = () => {
    setIsStopwatchRunning(false);
    setStopwatchTime(0);
    setLaps([]);
  };

  const handleAddLap = () => {
    if (stopwatchTime > 0) {
      setLaps((prev) => [{ id: prev.length + 1, time: stopwatchTime }, ...prev]);
    }
  };

  const formatStopwatchDisplay = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
  };

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
                  setEyesOpenStatus('Both Eyes Open! Looking great...');
                } else {
                  eyesOpenDurationRef.current = Math.max(0, eyesOpenDurationRef.current - 1.5);
                  if (!isLeftOpen && !isRightOpen) {
                    setEyesOpenStatus('Eyes Closed! Open wide!');
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
                setEyesOpenStatus('Face not centered. Look at lens!');
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
        setVoiceError('Could not start speech recognition. Use Skip button.');
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
    stopMelodyLoop();
    setDanceFailed(false);
    setDanceTimeRemaining(15);
    danceScoreRef.current = 0;
    setDanceProgress(0);

    const targetSong = trackToPlay || DANCE_PLAYLIST.find(t => t.id === currentDanceTrackId) || DANCE_PLAYLIST[0];
    if (danceAudioRef.current) {
      danceAudioRef.current.pause();
    }

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
          startMelodyLoop();
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

            // Sage Mint Skeleton
            canvasContext.lineWidth = 4;
            canvasContext.lineCap = 'round';
            canvasContext.strokeStyle = '#4e7a5e';
            canvasContext.shadowColor = '#6b8a76';
            canvasContext.shadowBlur = 8;

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

  // Real 8-Hour Optimal Sleep Math
  const calculateSleepDuration = useCallback(() => {
    let diffDeg = wakeAngle - bedAngle;
    if (diffDeg < 0) diffDeg += 360;
    let totalMinutes = Math.round((diffDeg / 360) * 12 * 60);
    let hrs = Math.floor(totalMinutes / 60);
    let mins = totalMinutes % 60;
    mins = Math.round(mins / 5) * 5;
    if (mins === 60) { mins = 0; hrs += 1; }

    const sleepPercent = Math.min(100, Math.round((totalMinutes / 480) * 100));

    return { 
      hrs: String(hrs).padStart(2, '0'), 
      mins: String(mins).padStart(2, '0'),
      totalMinutes,
      score: sleepPercent
    };
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

  const sleepDuration = calculateSleepDuration();

  const getSoundDisplayName = () => {
    if (selectedSound === 'custom') return 'Custom Track';
    const found = DEFAULT_SOUNDS.find((s) => s.id === selectedSound);
    return found ? found.name.split(' ')[1] || found.name : 'Chicken';
  };

  const currentActiveStepName = activePipeline[pipelineIndex] || null;

  // Real Dynamic Day Calculation (0 = SUN, 1 = MON, ... 6 = SAT)
  const currentDayIndex = new Date().getDay();

  // Clean Neumorphic Box Shadows
  const cardShadow = '10px 10px 24px #d8dacd, -10px -10px 24px #ffffff';
  const insetCardShadow = 'inset 5px 5px 12px #d8dacd, inset -5px -5px 12px #ffffff';

  return (
    <div style={{
      minHeight: '100dvh',
      width: '100vw',
      backgroundColor: '#f1f3ea',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: 0,
      padding: 0,
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      boxSizing: 'border-box',
      userSelect: 'none',
      color: '#274736'
    }}>

      {/* ==================== CUSTOM TIMER DURATION MODAL ==================== */}
      {isCustomTimerModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(39, 71, 54, 0.45)',
          backdropFilter: 'blur(16px)',
          zIndex: 130,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <form
            onSubmit={handleApplyCustomTimer}
            style={{
              width: '100%',
              maxWidth: '320px',
              backgroundColor: '#f1f3ea',
              borderRadius: '28px',
              padding: '24px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: '"Playfair Display", serif', margin: 0, fontSize: '18px', fontWeight: 600 }}>Custom Timer Duration</h3>
              <X size={20} color="#687e71" cursor="pointer" onClick={() => setIsCustomTimerModalOpen(false)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#687e71', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Hours</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={customTimerHours}
                  onChange={(e) => setCustomTimerHours(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '14px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #b7c0b0',
                    color: '#274736',
                    fontSize: '18px',
                    boxSizing: 'border-box',
                    textAlign: 'center',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#687e71', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={customTimerMins}
                  onChange={(e) => setCustomTimerMins(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '14px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #b7c0b0',
                    color: '#274736',
                    fontSize: '18px',
                    boxSizing: 'border-box',
                    textAlign: 'center',
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '16px',
                border: 'none',
                backgroundColor: '#274736',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '6px',
                boxShadow: '0 8px 18px rgba(39, 71, 54, 0.3)'
              }}
            >
              Set Timer
            </button>
          </form>
        </div>
      )}

      {/* ==================== ACTIVE ALARM RINGING SCREEN ==================== */}
      {isRinging && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(39, 71, 54, 0.45)',
          backdropFilter: 'blur(16px)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'max(14px, env(safe-area-inset-top)) 16px max(14px, env(safe-area-inset-bottom))'
        }}>
          <div style={{
            boxSizing: 'border-box',
            width: '100%',
            maxWidth: '380px',
            backgroundColor: '#f1f3ea',
            borderRadius: '34px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            position: 'relative',
            maxHeight: 'calc(100dvh - 24px)',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            padding: '24px 20px',
            border: '1px solid rgba(255, 255, 255, 0.6)'
          }}>
            {activePipeline.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center', marginBottom: '14px' }}>
                {activePipeline.map((step, idx) => (
                  <div
                    key={step}
                    style={{
                      flex: 1,
                      height: '4px',
                      borderRadius: '2px',
                      backgroundColor: idx <= pipelineIndex ? '#274736' : '#d2d6c6'
                    }}
                  />
                ))}
              </div>
            )}

            {activeRingingNote && (
              <div style={{
                width: '100%',
                backgroundColor: '#e6eae0',
                boxShadow: insetCardShadow,
                borderRadius: '18px',
                padding: '12px 14px',
                boxSizing: 'border-box',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textAlign: 'left'
              }}>
                <FileText size={20} color="#274736" style={{ flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#687e71', fontWeight: 600, letterSpacing: '0.6px' }}>
                    Morning Goal
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#274736', lineHeight: 1.2 }}>
                    "{activeRingingNote}"
                  </div>
                </div>
              </div>
            )}

            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: '#274736',
              boxShadow: '0 10px 20px rgba(39, 71, 54, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10px'
            }}>
              <BellRing size={24} color="#ffffff" />
            </div>

            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#687e71', fontWeight: 600 }}>
              {activePipeline.length > 0 ? `Mission ${pipelineIndex + 1} of ${activePipeline.length}` : 'Alarm Ringing'}
            </span>

            {/* STEP 1: MATH */}
            {currentActiveStepName === 'math' && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '24px', fontWeight: 600, margin: 0 }}>Solve Problem</h3>
                <p style={{ fontSize: '11px', color: '#687e71', margin: 0 }}>
                  Wake up your focus to silence alarm
                </p>

                <form onSubmit={handleVerifyMath} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    backgroundColor: '#e6eae0',
                    boxShadow: insetCardShadow,
                    borderRadius: '20px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '32px', fontWeight: 700, color: '#274736' }}>
                        {mathProblem.question} = ?
                      </span>
                      <button
                        type="button"
                        onClick={generateMathMission}
                        style={{ background: 'none', border: 'none', color: '#687e71', cursor: 'pointer' }}
                      >
                        <RefreshCw size={15} />
                      </button>
                    </div>

                    <input
                      type="number"
                      placeholder="Answer"
                      value={userAnswer}
                      onChange={(e) => { setUserAnswer(e.target.value); setMathError(false); }}
                      autoFocus
                      style={{
                        width: '130px',
                        textAlign: 'center',
                        padding: '10px',
                        borderRadius: '14px',
                        border: '1px solid #c8cdc0',
                        backgroundColor: '#ffffff',
                        color: '#274736',
                        fontSize: '18px',
                        fontWeight: 600,
                        outline: 'none'
                      }}
                    />
                    {mathError && <span style={{ fontSize: '11px', color: '#c2410c', fontWeight: 600 }}>Incorrect answer!</span>}
                  </div>

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '14px',
                      borderRadius: '18px',
                      border: 'none',
                      backgroundColor: '#274736',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 8px 18px rgba(39, 71, 54, 0.3)'
                    }}
                  >
                    Submit Answer <ChevronRight size={16} />
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2: BOTH EYES */}
            {currentActiveStepName === 'eyes' && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '24px', fontWeight: 600, margin: 0 }}>Open Both Eyes</h3>
                <p style={{ fontSize: '11px', color: '#687e71', margin: 0 }}>
                  Hold both eyes open for 1.5 seconds
                </p>

                <div style={{
                  position: 'relative',
                  width: '170px',
                  height: '170px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: openEyesProgress > 60 ? '3px solid #274736' : '3px solid #b7c0b0',
                  boxShadow: cardShadow,
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

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#274736' }}>
                    <span>{eyesOpenStatus}</span>
                    <span>{openEyesProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#d5dacf', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${openEyesProgress}%`,
                      height: '100%',
                      backgroundColor: '#274736',
                      transition: 'width 0.1s linear'
                    }} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: STRICT VOICE PHRASE */}
            {currentActiveStepName === 'voice' && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '24px', fontWeight: 600, margin: 0 }}>Speak Exact Phrase</h3>
                <p style={{ fontSize: '11px', color: '#687e71', margin: 0 }}>
                  Read this affirmation aloud clearly:
                </p>

                <div style={{
                  backgroundColor: '#e6eae0',
                  boxShadow: insetCardShadow,
                  borderRadius: '18px',
                  padding: '14px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#274736', fontStyle: 'italic', lineHeight: 1.4 }}>
                    "{targetVoicePhrase}"
                  </span>
                </div>

                {isListening && (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#687e71', fontWeight: 600 }}>
                      <span>Mic Sound Level</span>
                      <span>{voiceVolumeLevel}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#d5dacf', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${voiceVolumeLevel}%`,
                        height: '100%',
                        backgroundColor: '#274736',
                        transition: 'width 0.05s ease'
                      }} />
                    </div>
                  </div>
                )}

                {transcript && (
                  <div style={{ fontSize: '12px', color: '#687e71' }}>
                    Heard: <strong style={{ color: '#274736' }}>"{transcript}"</strong>
                  </div>
                )}

                {voiceError && <span style={{ fontSize: '11px', color: '#c2410c', fontWeight: 600 }}>{voiceError}</span>}

                <button
                  type="button"
                  onClick={handleStartVoiceRecognition}
                  disabled={isListening}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '18px',
                    border: 'none',
                    backgroundColor: isListening ? '#d97706' : '#274736',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: isListening ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 8px 18px rgba(39, 71, 54, 0.3)'
                  }}
                >
                  <Mic size={16} /> {isListening ? 'Listening... Speak Now!' : 'Tap Mic & Read Phrase'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    manualStopRef.current = true;
                    advancePipeline();
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '16px',
                    border: '1px solid #b7c0b0',
                    backgroundColor: '#eef0e6',
                    color: '#274736',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Skip / Force Complete Phrase
                </button>
              </div>
            )}

            {/* STEP 4: STRICT FULL-BODY DANCE MISSION */}
            {currentActiveStepName === 'dance' && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <h3 style={{ fontFamily: '"Playfair Display", serif', fontSize: '22px', fontWeight: 600, margin: 0 }}>Morning Dance</h3>

                {/* 15S Countdown & Audio Switcher Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  backgroundColor: danceFailed ? '#fecaca' : '#e6eae0',
                  boxShadow: insetCardShadow,
                  borderRadius: '14px',
                  padding: '6px 12px',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: danceFailed ? '#b91c1c' : '#274736' }}>
                    {danceFailed ? '🚨 15s Up! Alarm Ringing!' : `⏱️ Time Left: ${danceTimeRemaining}s`}
                  </div>

                  <select
                    value={currentDanceTrackId}
                    onChange={(e) => switchDanceSong(e.target.value)}
                    disabled={danceFailed}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #b7c0b0',
                      borderRadius: '8px',
                      color: '#274736',
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '3px 6px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {DANCE_PLAYLIST.map((trk) => (
                      <option key={trk.id} value={trk.id}>
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
                  borderRadius: '26px',
                  overflow: 'hidden',
                  border: danceProgress > 70 ? '3px solid #274736' : '2px solid #b7c0b0',
                  boxShadow: cardShadow,
                  backgroundColor: '#000'
                }}>
                  <video
                    ref={danceVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                  />
                  <canvas
                    ref={danceCanvasRef}
                    width={360}
                    height={480}
                    aria-hidden="true"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', transform: 'scaleX(-1)' }}
                  />

                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(0,0,0,0.65)',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#ffffff'
                  }}>
                    <Activity size={12} color="#ffffff" />
                    <span>{danceProgress}%</span>
                  </div>
                </div>

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#274736' }}>
                    <span>{danceStatus}</span>
                    <span>{danceProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#d5dacf', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${danceProgress}%`,
                      height: '100%',
                      backgroundColor: '#274736',
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
                      borderRadius: '16px',
                      border: 'none',
                      backgroundColor: '#274736',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      marginTop: '4px',
                      boxShadow: '0 8px 18px rgba(39, 71, 54, 0.3)'
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
                    borderRadius: '18px',
                    border: 'none',
                    backgroundColor: '#274736',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 8px 18px rgba(39, 71, 54, 0.3)'
                  }}
                >
                  Dismiss Alarm
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MISSION CUSTOMIZER MODAL (MATCHES CLEAN TEXT STYLE) ==================== */}
      {isMissionConfigOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(39, 71, 54, 0.45)',
          backdropFilter: 'blur(16px)',
          zIndex: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '330px',
            backgroundColor: '#f1f3ea',
            borderRadius: '30px',
            padding: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Leaf size={18} color="#274736" />
                <h3 style={{ fontFamily: '"Playfair Display", serif', margin: 0, fontSize: '18px', fontWeight: 600 }}>Missions Config</h3>
              </div>
              <X size={20} color="#687e71" cursor="pointer" onClick={() => setIsMissionConfigOpen(false)} />
            </div>

            <p style={{ fontSize: '11px', color: '#687e71', margin: 0 }}>
              Select morning disciplines to unlock alarm:
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#e6eae0',
              boxShadow: insetCardShadow,
              padding: '10px 14px',
              borderRadius: '16px'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>🧮 1. Math Challenge</div>
                <div style={{ fontSize: '10px', color: '#687e71' }}>Mental sharpness</div>
              </div>
              <input
                type="checkbox"
                checked={enabledMissions.math}
                onChange={(e) => setEnabledMissions({ ...enabledMissions, math: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#274736', cursor: 'pointer' }}
              />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#e6eae0',
              boxShadow: insetCardShadow,
              padding: '10px 14px',
              borderRadius: '16px'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>👁️ 2. Both Eyes Open AI</div>
                <div style={{ fontSize: '10px', color: '#687e71' }}>1.5s visual focus</div>
              </div>
              <input
                type="checkbox"
                checked={enabledMissions.eyes}
                onChange={(e) => setEnabledMissions({ ...enabledMissions, eyes: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#274736', cursor: 'pointer' }}
              />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#e6eae0',
              boxShadow: insetCardShadow,
              padding: '10px 14px',
              borderRadius: '16px'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>🎙️ 3. Voice Affirmation</div>
                <div style={{ fontSize: '10px', color: '#687e71' }}>Speak loud & clear</div>
              </div>
              <input
                type="checkbox"
                checked={enabledMissions.voice}
                onChange={(e) => setEnabledMissions({ ...enabledMissions, voice: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#274736', cursor: 'pointer' }}
              />
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#e6eae0',
              boxShadow: insetCardShadow,
              padding: '10px 14px',
              borderRadius: '16px'
            }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>💃 4. Morning Dance (15s)</div>
                <div style={{ fontSize: '10px', color: '#687e71' }}>Step back & full jump</div>
              </div>
              <input
                type="checkbox"
                checked={enabledMissions.dance}
                onChange={(e) => setEnabledMissions({ ...enabledMissions, dance: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#274736', cursor: 'pointer' }}
              />
            </div>

            <button
              onClick={() => setIsMissionConfigOpen(false)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '16px',
                border: 'none',
                backgroundColor: '#274736',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '4px',
                boxShadow: '0 8px 18px rgba(39, 71, 54, 0.3)'
              }}
            >
              Save Configuration
            </button>
          </div>
        </div>
      )}

      {/* ==================== SOUND SELECTOR MODAL ==================== */}
      {isSoundSelectorOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(39, 71, 54, 0.45)',
          backdropFilter: 'blur(16px)',
          zIndex: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '330px',
            backgroundColor: '#f1f3ea',
            borderRadius: '30px',
            padding: '22px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            maxHeight: '85vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Music size={18} color="#274736" />
                <h3 style={{ fontFamily: '"Playfair Display", serif', margin: 0, fontSize: '18px', fontWeight: 600 }}>Alarm Tone</h3>
              </div>
              <X size={20} color="#687e71" cursor="pointer" onClick={() => setIsSoundSelectorOpen(false)} />
            </div>

            <div style={{
              border: '2px dashed #b7c0b0',
              borderRadius: '16px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#e6eae0',
              cursor: 'pointer'
            }}
            onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={18} color="#274736" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#274736' }}>
                {customAudioData ? 'Change Custom Song' : '+ Upload Your Own MP3'}
              </span>
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
                  backgroundColor: selectedSound === 'custom' ? '#274736' : '#e6eae0',
                  color: selectedSound === 'custom' ? '#ffffff' : '#274736',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontWeight: 600,
                  fontSize: '13px'
                }}
              >
                <span>⭐ Custom Uploaded Song</span>
                {selectedSound === 'custom' && <Check size={16} />}
              </div>
            )}

            <div style={{ fontSize: '10px', color: '#687e71', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
              Sound Library
            </div>

            {DEFAULT_SOUNDS.map((sound) => (
              <div
                key={sound.id}
                onClick={() => handleSelectSound(sound.id)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '14px',
                  backgroundColor: selectedSound === sound.id ? '#274736' : '#e6eae0',
                  color: selectedSound === sound.id ? '#ffffff' : '#274736',
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
          backgroundColor: 'rgba(39, 71, 54, 0.45)',
          backdropFilter: 'blur(16px)',
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
              maxWidth: '320px',
              backgroundColor: '#f1f3ea',
              borderRadius: '28px',
              padding: '24px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: '"Playfair Display", serif', margin: 0, fontSize: '18px', fontWeight: 600 }}>New Alarm</h3>
              <X size={20} color="#687e71" cursor="pointer" onClick={() => setIsAddModalOpen(false)} />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#687e71', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Time</label>
              <input
                type="time"
                value={newAlarmTime}
                onChange={(e) => setNewAlarmTime(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #b7c0b0',
                  color: '#274736',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontWeight: 600
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#687e71', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Days / Frequency</label>
              <input
                type="text"
                placeholder="e.g. Workdays, Mon-Fri"
                value={newAlarmLabel}
                onChange={(e) => setNewAlarmLabel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #b7c0b0',
                  color: '#274736',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontWeight: 600
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', color: '#274736', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Wake-Up Purpose / Reason
              </label>
              <input
                type="text"
                placeholder="e.g. Gym workout / Flight at 8 AM"
                value={newAlarmCustomNote}
                onChange={(e) => setNewAlarmCustomNote(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '14px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #274736',
                  color: '#274736',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                  outline: 'none',
                  fontWeight: 600
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '16px',
                border: 'none',
                backgroundColor: '#274736',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '6px',
                boxShadow: '0 8px 18px rgba(39, 71, 54, 0.3)'
              }}
            >
              Add Alarm
            </button>
          </form>
        </div>
      )}

      {/* ==================== PHONE CARD CONTAINER (MAX 410px) ==================== */}
      <div style={{
        width: '100%',
        maxWidth: '410px',
        minHeight: '100dvh',
        backgroundColor: '#f1f3ea',
        padding: '20px 18px 14px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        boxSizing: 'border-box'
      }}>

        {/* ================= PAGE 1: SLEEP / WAKE DIAL ================= */}
        {activeTab === 'sleep' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
            
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <h1 style={{
                fontFamily: '"Playfair Display", serif',
                margin: 0,
                fontSize: '24px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                color: '#274736'
              }}>
                MINT / MODE
              </h1>
              <span style={{ fontSize: '10px', color: '#687e71', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
                Sleep Rhythms & Recovery
              </span>
            </div>

            {/* Neumorphic Dial Box */}
            <div style={{
              backgroundColor: '#f1f3ea',
              borderRadius: '34px',
              boxShadow: cardShadow,
              padding: '18px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              marginBottom: '12px'
            }}>
              <div style={{ position: 'absolute', top: '14px', left: '16px', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e5e9de', boxShadow: cardShadow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Leaf size={15} color="#274736" />
              </div>
              <div style={{ position: 'absolute', top: '14px', right: '16px', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#e5e9de', boxShadow: cardShadow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => triggerAlarmRing('CogniWake Mission', alarmNote)}
              >
                <BarChart2 size={15} color="#274736" style={{ cursor: 'pointer' }} />
              </div>

              {/* Central Dial */}
              <div ref={dialRef} style={{
                position: 'relative',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                backgroundColor: '#f1f3ea',
                boxShadow: insetCardShadow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'none',
                marginTop: '6px'
              }}>
                <svg 
                  style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    width: '100%', 
                    height: '100%', 
                    transform: `rotate(${bedAngle - 90}deg)`, 
                    transformOrigin: '90px 90px',
                    pointerEvents: 'none' 
                  }} 
                  viewBox="0 0 180 180"
                >
                  <circle
                    cx="90"
                    cy="90"
                    r="78"
                    fill="none"
                    stroke="#507c61"
                    strokeWidth="9"
                    strokeDasharray={2 * Math.PI * 78}
                    strokeDashoffset={(2 * Math.PI * 78) - (((wakeAngle - bedAngle + 360) % 360) / 360) * (2 * Math.PI * 78)}
                    strokeLinecap="round"
                  />
                </svg>

                <div style={{
                  width: '124px',
                  height: '124px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}>
                  <Leaf size={15} color="#507c61" style={{ marginBottom: '3px' }} />

                  <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '24px', fontWeight: 700, color: '#274736', lineHeight: 1 }}>
                    {sleepDuration.hrs}:{sleepDuration.mins}
                  </div>

                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#687e71', marginTop: '3px' }}>
                    {sleepDuration.score}% of 8h
                  </span>
                </div>

                {/* Bed Handle */}
                <div
                  onMouseDown={() => setActiveHandle('bed')}
                  onTouchStart={() => setActiveHandle('bed')}
                  style={{
                    position: 'absolute',
                    left: `${90 + 78 * Math.cos((bedAngle - 90) * (Math.PI / 180))}px`,
                    top: `${90 + 78 * Math.sin((bedAngle - 90) * (Math.PI / 180))}px`,
                    transform: 'translate(-50%, -50%)',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    border: '2px solid #274736',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                    cursor: 'grab',
                    zIndex: 10
                  }}
                />

                {/* Wake Handle */}
                <div
                  onMouseDown={() => setActiveHandle('wake')}
                  onTouchStart={() => setActiveHandle('wake')}
                  style={{
                    position: 'absolute',
                    left: `${90 + 78 * Math.cos((wakeAngle - 90) * (Math.PI / 180))}px`,
                    top: `${90 + 78 * Math.sin((wakeAngle - 90) * (Math.PI / 180))}px`,
                    transform: 'translate(-50%, -50%)',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#274736',
                    border: '2px solid #ffffff',
                    boxShadow: '0 4px 10px rgba(39, 71, 54, 0.4)',
                    cursor: 'grab',
                    zIndex: 10
                  }}
                />
              </div>

              {/* Time Badges */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', marginTop: '14px' }}>
                <div style={{
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                  padding: '10px 12px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '10px', color: '#687e71', fontWeight: 600 }}>BedTime</span>
                  <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '17px', fontWeight: 700, color: '#274736' }}>
                    {angleToTime(bedAngle)}
                  </span>
                </div>

                <div style={{
                  backgroundColor: '#274736',
                  boxShadow: '0 6px 14px rgba(39, 71, 54, 0.25)',
                  padding: '10px 12px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  color: '#ffffff'
                }}>
                  <span style={{ fontSize: '10px', color: '#d2ded7', fontWeight: 600 }}>Wake up</span>
                  <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '17px', fontWeight: 700 }}>
                    {angleToTime(wakeAngle)}
                  </span>
                </div>
              </div>
            </div>

            {/* FIXED OVERLAP BUG: Clean spacing, no text collision */}
            <div style={{
              backgroundColor: '#f1f3ea',
              borderRadius: '28px',
              boxShadow: cardShadow,
              padding: '16px',
              marginBottom: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '16px', fontWeight: 600 }}>
                  Weekly Rhythm
                </span>
                <span style={{ fontSize: '11px', color: '#274736', fontWeight: 600 }}>
                  {sleepDuration.score}% Optimal (8h Goal)
                </span>
              </div>

              {/* Dynamic 7-Day Rhythm with today's real day highlighted */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-end', 
                height: '75px', 
                padding: '4px 2px 0 2px'
              }}>
                {[
                  { d: 'MON', dayNum: 1, hrs: '7.5h', pct: 93 },
                  { d: 'TUE', dayNum: 2, hrs: '6.0h', pct: 75 },
                  { d: 'WED', dayNum: 3, hrs: '7.0h', pct: 87 },
                  { d: 'THU', dayNum: 4, hrs: '8.0h', pct: 100 },
                  { d: 'FRI', dayNum: 5, hrs: '7.2h', pct: 90 },
                  { d: 'SAT', dayNum: 6, hrs: '6.5h', pct: 81 },
                  { d: 'SUN', dayNum: 0, hrs: `${sleepDuration.hrs}h`, pct: sleepDuration.score }
                ].map((item, idx) => {
                  const isToday = currentDayIndex === item.dayNum;
                  const displayHrs = isToday ? `${sleepDuration.hrs}h` : item.hrs;
                  const displayPct = isToday ? sleepDuration.score : item.pct;

                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <span style={{ 
                        fontSize: '9px', 
                        fontWeight: isToday ? 700 : 500, 
                        color: isToday ? '#274736' : '#687e71',
                        lineHeight: 1
                      }}>
                        {displayHrs}
                      </span>
                      <div style={{
                        width: '26px',
                        height: `${Math.max(16, (displayPct / 100) * 44)}px`,
                        borderRadius: '8px',
                        backgroundColor: isToday ? '#274736' : '#c8d4c9',
                        boxShadow: isToday ? '0 4px 10px rgba(39, 71, 54, 0.25)' : 'none',
                        transition: 'height 0.3s ease, background-color 0.3s ease'
                      }} />
                      <span style={{ 
                        fontSize: '9px', 
                        fontWeight: isToday ? 700 : 500, 
                        color: isToday ? '#274736' : '#687e71',
                        marginTop: '2px'
                      }}>
                        {item.d}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Link: Missions Settings */}
            <div 
              onClick={() => setIsMissionConfigOpen(true)}
              style={{
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
                borderRadius: '18px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Leaf size={18} color="#274736" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#274736' }}>4 Morning Disciplines</span>
              </div>
              <ChevronRight size={16} color="#687e71" />
            </div>

          </div>
        )}

        {/* ================= PAGE 2: TIMER (WITH CUSTOM DURATION PICKER) ================= */}
        {activeTab === 'timer' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <h1 style={{
                fontFamily: '"Playfair Display", serif',
                margin: 0,
                fontSize: '26px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                color: '#274736'
              }}>
                FOCUS / TIMER
              </h1>
              <span style={{ fontSize: '10px', color: '#687e71', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
                Deep Work & Power Naps
              </span>
            </div>

            {/* Timer Circular Card */}
            <div style={{
              backgroundColor: '#f1f3ea',
              borderRadius: '34px',
              boxShadow: cardShadow,
              padding: '22px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{
                position: 'relative',
                width: '190px',
                height: '190px',
                borderRadius: '50%',
                backgroundColor: '#f1f3ea',
                boxShadow: insetCardShadow,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg 
                  style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    width: '100%', 
                    height: '100%', 
                    transform: 'rotate(-90deg)', 
                    transformOrigin: '95px 95px' 
                  }} 
                  viewBox="0 0 190 190"
                >
                  <circle
                    cx="95"
                    cy="95"
                    r="82"
                    fill="none"
                    stroke="#4e7a5e"
                    strokeWidth="9"
                    strokeDasharray={2 * Math.PI * 82}
                    strokeDashoffset={(2 * Math.PI * 82) * (1 - (timerSecondsLeft / Math.max(1, timerDuration)))}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                  />
                </svg>

                <div style={{
                  width: '130px',
                  height: '130px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Leaf size={16} color="#507c61" style={{ marginBottom: '3px' }} />
                  <div style={{
                    fontFamily: '"Playfair Display", serif',
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#274736',
                    lineHeight: 1
                  }}>
                    {formatTimerDisplay(timerSecondsLeft)}
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#687e71', marginTop: '4px' }}>
                    {isTimerRunning ? 'In Session' : 'Ready'}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginTop: '20px' }}>
                <button
                  onClick={handleResetTimer}
                  title="Reset Timer"
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: '#f1f3ea',
                    boxShadow: cardShadow,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#274736'
                  }}
                >
                  <RotateCcw size={16} />
                </button>

                <button
                  onClick={handleToggleTimer}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#4e7a5e',
                    boxShadow: '0 10px 24px rgba(78, 122, 94, 0.4)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#ffffff'
                  }}
                >
                  {isTimerRunning ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: '3px' }} />}
                </button>

                <button
                  onClick={() => setIsCustomTimerModalOpen(true)}
                  title="Set Custom Duration"
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    backgroundColor: '#f1f3ea',
                    boxShadow: cardShadow,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#274736'
                  }}
                >
                  <Sliders size={16} />
                </button>
              </div>
            </div>

            {/* Presets */}
            <div style={{
              backgroundColor: '#f1f3ea',
              borderRadius: '26px',
              boxShadow: cardShadow,
              padding: '14px 16px',
              marginTop: '12px'
            }}>
              <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '15px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Timer Presets
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { name: '1 Hour Study / Work', mins: 60, icon: Leaf },
                  { name: 'Pomodoro Focus', mins: 25, icon: Sun },
                  { name: 'Power Nap', mins: 15, icon: Moon }
                ].map((mode, i) => (
                  <div
                    key={i}
                    onClick={() => handleSetTimerPreset(mode.mins)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '14px',
                      backgroundColor: timerDuration === mode.mins * 60 ? '#ffffff' : 'transparent',
                      boxShadow: timerDuration === mode.mins * 60 ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <mode.icon size={15} color="#507c61" />
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{mode.name}</span>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: '#687e71' }}>{mode.mins}m</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ================= PAGE 3: STOPWATCH / STUDY ACTIVITY TRACKER ================= */}
        {activeTab === 'stopwatch' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <h1 style={{
                fontFamily: '"Playfair Display", serif',
                margin: 0,
                fontSize: '26px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                color: '#274736'
              }}>
                STUDY / TRACK
              </h1>
              <span style={{ fontSize: '10px', color: '#687e71', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
                Track Reading & Activity
              </span>
            </div>

            {/* Stopwatch Raised Card */}
            <div style={{
              backgroundColor: '#f1f3ea',
              borderRadius: '34px',
              boxShadow: cardShadow,
              padding: '24px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{
                width: '210px',
                height: '110px',
                backgroundColor: '#ffffff',
                boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
                borderRadius: '26px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #dcdfd5'
              }}>
                <Clock size={18} color="#274736" style={{ marginBottom: '4px' }} />
                <div style={{
                  fontFamily: '"Playfair Display", serif',
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#274736',
                  letterSpacing: '0.5px'
                }}>
                  {formatStopwatchDisplay(stopwatchTime)}
                </div>
                <span style={{ fontSize: '9px', fontWeight: 600, color: '#687e71', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {isStopwatchRunning ? 'Tracking Active' : 'Stopped'}
                </span>
              </div>

              {/* Stopwatch Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '22px' }}>
                <button
                  onClick={handleResetStopwatch}
                  title="Reset"
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: '#f1f3ea',
                    boxShadow: cardShadow,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#274736'
                  }}
                >
                  <RotateCcw size={16} />
                </button>

                <button
                  onClick={handleToggleStopwatch}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: isStopwatchRunning ? '#b91c1c' : '#274736',
                    boxShadow: '0 10px 24px rgba(39, 71, 54, 0.4)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#ffffff'
                  }}
                >
                  {isStopwatchRunning ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: '3px' }} />}
                </button>

                <button
                  onClick={handleAddLap}
                  disabled={!isStopwatchRunning}
                  title="Save Lap / Split"
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: '#f1f3ea',
                    boxShadow: cardShadow,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isStopwatchRunning ? 'pointer' : 'default',
                    color: isStopwatchRunning ? '#274736' : '#a8b0a5'
                  }}
                >
                  <Flag size={16} />
                </button>
              </div>
            </div>

            {/* Laps / Sessions History */}
            <div style={{
              backgroundColor: '#f1f3ea',
              borderRadius: '26px',
              boxShadow: cardShadow,
              padding: '14px 16px',
              marginTop: '12px',
              maxHeight: '140px',
              overflowY: 'auto'
            }}>
              <span style={{ fontFamily: '"Playfair Display", serif', fontSize: '15px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Study Splits ({laps.length})
              </span>

              {laps.length === 0 ? (
                <div style={{ fontSize: '11px', color: '#687e71', textAlign: 'center', padding: '10px 0' }}>
                  Tap Flag button while running to record sessions!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {laps.map((lap) => (
                    <div
                      key={lap.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}
                    >
                      <span style={{ color: '#687e71' }}>Session #{lap.id}</span>
                      <span style={{ color: '#274736' }}>{formatStopwatchDisplay(lap.time)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ================= PAGE 4: ALARMS LIST ================= */}
        {activeTab === 'alarms' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontFamily: '"Playfair Display", serif', margin: 0, fontSize: '26px', fontWeight: 700 }}>
                  Alarms
                </h2>
                <span style={{ fontSize: '11px', color: '#687e71', fontWeight: 600 }}>Wake-Up Schedules</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                style={{
                  background: '#274736',
                  border: 'none',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#ffffff',
                  boxShadow: '0 6px 14px rgba(39, 71, 54, 0.3)'
                }}
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Master Settings Box */}
            <div style={{
              backgroundColor: '#f1f3ea',
              borderRadius: '26px',
              boxShadow: cardShadow,
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              margin: '14px 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>Master Alarm Trigger</span>
                  <div style={{ fontSize: '11px', color: '#687e71' }}>Enable or pause automated ringing</div>
                </div>
                <div
                  onClick={() => setAlarmEnabled(!alarmEnabled)}
                  style={{
                    width: '46px',
                    height: '26px',
                    borderRadius: '13px',
                    backgroundColor: alarmEnabled ? '#274736' : '#d5dacf',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '3px',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    justifyContent: alarmEnabled ? 'flex-end' : 'flex-start',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ffffff', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#687e71', fontWeight: 600 }}>
                <div 
                  onClick={() => setIsSoundSelectorOpen(true)}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#274736' }}
                >
                  <span>Tone: <strong>{getSoundDisplayName()}</strong></span>
                  <ChevronRight size={14} />
                </div>
                <button
                  onClick={handleTogglePreview}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: isPlayingPreview ? '#274736' : '#687e71',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: 0
                  }}
                >
                  {isPlayingPreview ? <Volume2 size={14} color="#274736" /> : <VolumeX size={14} color="#687e71" />}
                  <span>{isPlayingPreview ? 'Stop' : 'Preview'}</span>
                </button>
              </div>

              <div style={{ position: 'relative', width: '100%', height: '6px', backgroundColor: '#d5dacf', borderRadius: '3px', display: 'flex', alignItems: 'center' }}>
                <div style={{ height: '100%', width: `${volume}%`, backgroundColor: '#274736', borderRadius: '3px' }} />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => handleVolumeChange(e.target.value)}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                />
              </div>
            </div>

            {/* Alarms Items List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
              {alarms.map((alarm) => (
                <div
                  key={alarm.id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '20px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.04)',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontFamily: '"Playfair Display", serif', fontSize: '20px', fontWeight: 700, color: alarm.active ? '#274736' : '#9aa399' }}>
                      {alarm.time}
                    </div>
                    <div style={{ fontSize: '11px', color: '#687e71', fontWeight: 500 }}>{alarm.note || alarm.label}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {!alarm.isDialSync && (
                      <button onClick={() => deleteAlarm(alarm.id)} style={{ background: 'none', border: 'none', color: '#9aa399', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                    <div
                      onClick={() => toggleAlarm(alarm.id)}
                      style={{
                        width: '42px',
                        height: '24px',
                        borderRadius: '12px',
                        backgroundColor: alarm.active ? '#274736' : '#d5dacf',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '2px',
                        boxSizing: 'border-box',
                        cursor: 'pointer',
                        justifyContent: alarm.active ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#ffffff' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ================= 4-TAB NEUMORPHIC BOTTOM NAVIGATION ================= */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          backgroundColor: '#f1f3ea',
          boxShadow: cardShadow,
          borderRadius: '26px',
          padding: '10px 10px',
          marginTop: '12px'
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
              color: activeTab === 'sleep' ? '#274736' : '#889a8e',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            <Compass size={18} />
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sleep</span>
          </button>
          
          <button
            onClick={() => setActiveTab('timer')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              color: activeTab === 'timer' ? '#274736' : '#889a8e',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            <Leaf size={18} />
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Timer</span>
          </button>

          <button
            onClick={() => setActiveTab('stopwatch')}
            style={{
              background: 'none',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              color: activeTab === 'stopwatch' ? '#274736' : '#889a8e',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            <Clock size={18} />
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Track</span>
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
              color: activeTab === 'alarms' ? '#274736' : '#889a8e',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            <Bell size={18} />
            <span style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Alarms</span>
          </button>
        </div>

      </div>

    </div>
  );
}