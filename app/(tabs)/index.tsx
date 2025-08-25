import React, { useState, useRef, useEffect } from 'react';
import {
   View,
   Text,
   StyleSheet,
   TouchableOpacity,
   SafeAreaView,
   Animated,
   Dimensions,
   ScrollView,
   LayoutAnimation,
   Platform,
   UIManager,
   Easing,
   Pressable,
   Modal,
   Button,
   AppState,
   Image,
   ImageBackground
} from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { Mic, MoreHorizontal, Volume2, Users, Check, Square, FileQuestion, ChevronRight, Bookmark, Play, Pause } from 'lucide-react-native';
import BubbleIcon from '@/assets/svgs/bubble.svg';
import apiClient from '@/utils/api-client';
import * as FileSystem from 'expo-file-system';
import { useI18n } from '@/store/i18n-store';
import { Buffer } from "buffer";
import axios from 'axios';
import { useAuth } from '@/store/auth-store';
import { loadHistory, saveHistory, useSettings } from '@/store/settings-store';
import { useNotes } from '@/store/notes-store';
import Toast from 'react-native-toast-message';
import Slider from "@react-native-community/slider";
import { Picker } from "@react-native-picker/picker";
import { Wave, Bounce } from 'react-native-animated-spinkit'
import { BlurView } from 'expo-blur';

const langs = [
   { name: "chinese", code: "zh" },
   { name: "english", code: "en" },
   { name: "french", code: "fr" },
   { name: "spanish", code: "es" },
   { name: "german", code: "de" },
   { name: "italian", code: "it" },
   { name: "portuguese", code: "pt" },
   { name: "russian", code: "ru" },
   { name: "japanese", code: "ja" },
   { name: "arabic", code: "ar" },
   { name: "hindi", code: "hi" },
   { name: "norwegian", code: "no" },
   { name: "nynorsk", code: "nn" }
];


// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
   UIManager.setLayoutAnimationEnabledExperimental(true);
}
const { width, height } = Dimensions.get('window');


export interface TranslationMessage {
   id: string;
   who: 'user' | 'respondent';
   type: "original" | "translated";
   originalText?: string;
   translatedText?: string;
   language: string;
   fromLanguage?: string;
   toLanguage?: string;
   duration?: string;
   date?: Date
}
const recordingOptions: Audio.RecordingOptions = {
   isMeteringEnabled: true,
   android: {
      extension: '.m4a',
      outputFormat: Audio.AndroidOutputFormat.MPEG_4,
      audioEncoder: Audio.AndroidAudioEncoder.AAC,
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
   },
   ios: {
      extension: '.m4a',
      outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
      audioQuality: Audio.IOSAudioQuality.MAX,
      sampleRate: 44100,
      numberOfChannels: 2,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
   },
   web: {
      mimeType: 'audio/webm',
      bitsPerSecond: 128000,
   },
};

export default function HomeScreen() {
   const { language, t } = useI18n()
   const [isRecording, setIsRecording] = useState(false);
   const [isProcessing, setIsProcessing] = useState(false);
   const [detectedLanguage, setDetectedLanguage] = useState('');
   const [showModeSelector, setShowModeSelector] = useState(false);
   const [messages, setMessages] = useState<TranslationMessage[]>([]);
   const [showSettings, setShowSettings] = useState(false)
   const slideAnim = React.useRef(new Animated.Value(0)).current;
   const [playingConversationId, setPlayingConversationId] = useState<string | null>(null);
   const [sound, setSound] = useState(null)
   const { selectedVoice, isMinimalMode, setIsMinimalMode, outputLang, inputLang, setHistory, voicePlayback, saveHistory: saveHistorySetting } = useSettings()
   const { user } = useAuth()
   const { addNote } = useNotes()
   const scrollViewRef = useRef<ScrollView>(null);
   const [showLanguages, setShowLanguages] = useState(false)
   const [showInputLanguages, setShowInputLanguages] = useState(false)
   const [selectedOutputLang, setSelectedOutputLang] = useState({ name: '', code: '' })
   const [selectedInputLanguage, setSelectedInputLanguage] = useState({ name: "", code: "" })
   const [volume, setVolume] = useState(1)
   const pulseAnim = useRef(new Animated.Value(1)).current;
   const recording = useRef<Audio.Recording | null>(null);
   const [showVolumeModal, setShowVolumeModal] = useState(false);
   const [selectedInput, setSelectedInput] = useState("default");
   const [modalVisible, setModalVisible] = useState(false);

   const handleVolumeChange = (val: any) => {
      setVolume(val)
   }

   useEffect(() => {
      configureAudio();
   }, []);

   useEffect(() => {
      const subscription = AppState.addEventListener('change', state => {
         if (state === 'background') {
            saveHistory(messages, user?.id, detectedLanguage, outputLang === 'autoDetect' ? language : selectedOutputLang.code);
         }
      });

      return () => subscription.remove();
   }, [messages, user, detectedLanguage, outputLang, language, selectedOutputLang]); useEffect(() => {
      const loadUserHistory = async () => {
         const conversations = await loadHistory(user?.id);
         setHistory(conversations);
      };
      loadUserHistory();
   }, [user, setHistory, messages])

   useEffect(() => {
      setMessages([]);
   }, [selectedOutputLang, outputLang]);

   useEffect(() => {
      if (outputLang === 'autoDetect') {
         setMessages([])
      }
   }, [language])

   React.useEffect(() => {
      Animated.timing(slideAnim, {
         toValue: 1,
         duration: 300,
         easing: Easing.out(Easing.quad),
         useNativeDriver: true,
      }).start();

      return () => {
         Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
         }).start();
      };
   }, [messages]);

   useEffect(() => {
      if (scrollViewRef.current) {
         scrollViewRef.current.scrollToEnd({ animated: true });
      }
   }, [messages]);


   const configureAudio = async () => {
      try {
         await Audio.requestPermissionsAsync();
         await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: selectedInput === "earpiece",
         });
      } catch (error) {
         console.error('Failed to configure audio:', error);
      }
   };

   const startPulseAnimation = () => {
      Animated.loop(
         Animated.sequence([
            Animated.timing(pulseAnim, {
               toValue: 1.1,
               duration: 1000,
               useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
               toValue: 1,
               duration: 1000,
               useNativeDriver: true,
            }),
         ])
      ).start();
   };

   const stopPulseAnimation = () => {
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, {
         toValue: 1,
         duration: 200,
         useNativeDriver: true,
      }).start();
   };

   const formatDuration = (durationMs: number) => {
      const totalSeconds = Math.floor(durationMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
   };
   const startRecording = async () => {
      try {
         if (outputLang === 'select' && selectedOutputLang.code === '') return Toast.show({ type: "error", text1: "Please select output language" })
         if (inputLang === 'select' && selectedInputLanguage.code === '') return Toast.show({ type: 'error', text1: "Please select input language" })
         setIsRecording(true);
         startPulseAnimation();

         const { recording: newRecording } = await Audio.Recording.createAsync(recordingOptions as Audio.RecordingOptions);
         recording.current = newRecording;
      } catch (error) {
         console.error('Failed to start recording:', error);
         setIsRecording(false);
         stopPulseAnimation();
      }
   };

   const stopRecording = async () => {
      try {
         setIsRecording(false);
         setIsProcessing(true);
         stopPulseAnimation();

         if (recording.current) {
            await recording.current.stopAndUnloadAsync();
            const uri = recording.current.getURI();
            const status = await recording.current.getStatusAsync();
            const durationMs = status.durationMillis || 0; // duration in ms
            const durationFormatted = formatDuration(durationMs);
            recording.current = null;

            if (uri) {
               await sendAudioForTranscription(uri, durationFormatted);
            }
         }
      } catch (error) {
         console.error('Failed to stop recording:', error);
      } finally {
         setIsProcessing(false);
      }
   };

   const sendAudioForTranscription = async (uri: string, duration: string) => {
      try {

         // Step 1: Transcribe the audio
         const formData = new FormData();
         formData.append('file', {
            uri,
            type: "audio/mp4",
            name: "recording.m4a"
         } as any);

         const transcribeResponse = await apiClient.post('/transcribe', formData, {
            headers: {
               'Content-Type': 'multipart/form-data',
            },
         });

         if (!transcribeResponse.text) {
            console.error('No text received from transcription');
            return;
         }

         const detectedLang = transcribeResponse.language || detectedLanguage;
         const transcribedMessage: TranslationMessage = {
            id: Date.now().toString(),
            type: 'original',
            who: "user",
            originalText: transcribeResponse.text,
            language: inputLang === 'autoDetect' ? detectedLang : selectedInputLanguage.name,
            date: new Date(Date.now()),
            duration: duration,
         };

         setMessages(prev => {
            const updated = [...prev, transcribedMessage];
            // Save history after adding message
            if (saveHistorySetting) saveHistory(updated, user?.id, detectedLang, outputLang === 'autoDetect' ? language : selectedOutputLang.code);
            return updated;
         });


         // Step 2: Translate the transcribed text
         const translateResponse = await apiClient.post('/translate', {
            text: transcribeResponse.text,
            source_language: inputLang === 'autoDetect' ? transcribeResponse.language : selectedInputLanguage.code,
            target_language: outputLang === 'autoDetect' ? language : selectedOutputLang.code,
            context: 'any'
         });

         if (!translateResponse.translated_text) {
            console.error('No translation received');
            return;
         }

         // Step 3: Create message with original and translated text
         const newMessage: TranslationMessage = {
            id: Date.now().toString(),
            type: 'translated',
            who: "respondent",
            originalText: transcribeResponse.text,
            translatedText: translateResponse.translated_text,
            language: translateResponse.source_language || transcribeResponse.language || detectedLanguage,
            date: new Date(Date.now()),
            duration: duration
         };

         setMessages(prev => {
            const updated = [...prev, newMessage];
            if (saveHistorySetting) saveHistory(updated, user?.id, detectedLang, outputLang === 'autoDetect' ? language : selectedOutputLang.code);
            return updated;
         });

         if (inputLang === 'autoDetect') setDetectedLanguage(translateResponse.source_language || detectedLang);

         // Step 4: Synthesize and play the translated text
         await synthesizeAndPlayText(translateResponse.translated_text, language);

      } catch (error) {
         console.error('Failed to process audio:', JSON.stringify(error));
      }
   };

   function arrayBufferToBase64(buffer: any) {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
         binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
   }

   const synthesizeAndPlayText = async (text: string, language: string) => {
      setPlayingConversationId('playing');

      try {

         const params = new URLSearchParams({
            text: text,
            language: language,
            voice: `${selectedVoice?.id}`
         });

         const response = await apiClient.post(`/synthesize?${params.toString()}`, null, {
            responseType: 'arraybuffer',
         });

         const base64Audio = arrayBufferToBase64(response);
         const fileUri = FileSystem.documentDirectory + 'tts_audio.mp3';

         await FileSystem.writeAsStringAsync(fileUri, base64Audio, { encoding: FileSystem.EncodingType.Base64 });
         const { sound } = await Audio.Sound.createAsync({ uri: fileUri });

         await sound.setVolumeAsync(volume)

         await sound.playAsync();
         // Reset playing state when sound finishes
         sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
               setPlayingConversationId(null);
            }
         });
      } catch (error) {
         console.error('Failed to synthesize speech:', error);
         Speech.speak(text, {
            language,
         });
         setPlayingConversationId(null);
      }
   };

   const saveMessageAsNote = async (message: TranslationMessage) => {
      console.log(message)
      try {
         const isOriginal = message.type === 'original';

         await addNote({
            userId: '', // Will be set by store
            title: message.originalText!,
            translatedContent: message.translatedText!,
            originalLanguage: message.language,
            targetLanguage: isOriginal ? undefined : (outputLang === 'autoDetect' ? language : selectedOutputLang.code),
            isStarred: false,
            tags: ['message'],
         });

         Toast.show({
            type: 'success',
            text1: 'Saved as note!',
            text2: 'Message saved to your notes'
         });
      } catch (error) {
         Toast.show({
            type: 'error',
            text1: 'Failed to save note',
            text2: 'Please try again'
         });
      }
   };

   const toggleRecording = () => {
      if (isRecording) {
         stopRecording();
      } else {
         startRecording();
      }
   };

   const toggleModeSelector = () => {
      setShowModeSelector(!showModeSelector);
      setShowSettings(false)
   };

   const toggleSettings = () => {
      setShowInputLanguages(false)
      setShowLanguages(false)
      setShowSettings(!showSettings)
      setShowModeSelector(false)
   }

   const selectMode = (minimal: boolean) => {
      setIsMinimalMode(minimal);
      setShowInputLanguages(false)
      setShowLanguages(false)
      setShowModeSelector(false);
   };

   const toggleShowLanguages = () => {
      setShowSettings(false)
      setShowModeSelector(false);
      setShowInputLanguages(false)
      setShowLanguages(!showLanguages)
   }

   const toggleShowInputLanguages = () => {
      setShowSettings(false)
      setShowModeSelector(false);
      setShowLanguages(false)
      setShowInputLanguages(!showInputLanguages)
   }
   const renderInputLangSelector = () => {
      if (inputLang === 'autoDetect') return null

      return (
         <View style={styles.overlay}>
            <Pressable style={styles.overlayPressable} onPress={toggleShowInputLanguages} />
            <BlurView intensity={80} tint="light" style={{ maxHeight: 400, position: "absolute", top: 45, right: 10, backgroundColor: "rgba(255, 255, 255, 0.95)", padding: 14, borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8, overflow: 'hidden' }}>
               <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 350 }}>
                  {
                     langs.map((lang, index) => (
                        <View key={index} style={{ paddingHorizontal: 15, paddingVertical: 10 }}>
                           <TouchableOpacity style={{ minWidth: '100%', padding: 12, backgroundColor: 'transparent' }} onPress={() => {
                              setSelectedInputLanguage(lang)
                              setShowInputLanguages(false)
                           }} key={index}>
                              <Text style={{ color: '#1C1C1E' }}>{lang.name} ({lang.code.toUpperCase()})</Text>
                           </TouchableOpacity>
                           {index < langs.length - 1 && <View style={styles.modeSeparator} />}
                        </View>
                     ))
                  }
               </ScrollView>
            </BlurView>
         </View>
      )
   }

   const renderLanguages = () => {
      if (outputLang === 'autoDetect') return null;

      return (
         <View style={styles.overlay}>
            <Pressable style={styles.overlayPressable} onPress={toggleShowLanguages} />
            <BlurView intensity={80} tint="light" style={{ maxHeight: 400, position: "absolute", top: 45, right: 10, backgroundColor: "rgba(255, 255, 255, 0.95)", padding: 14, borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8, overflow: 'hidden' }}>
               <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 350 }}>
                  {
                     langs.map((lang, index) => (
                        <View key={index} style={{ paddingHorizontal: 15, paddingVertical: 10 }}>
                           <TouchableOpacity style={{ minWidth: '100%', padding: 12, backgroundColor: 'transparent' }} onPress={() => {
                              setSelectedOutputLang(lang)
                              setShowLanguages(false)
                           }} key={index}>
                              <Text style={{ color: '#1C1C1E' }}>{lang.name} ({lang.code.toUpperCase()})</Text>
                           </TouchableOpacity>
                           {index < langs.length - 1 && <View style={styles.modeSeparator} />}
                        </View>
                     ))
                  }
               </ScrollView>
            </BlurView>
         </View>
      )
   }

   const renderInputSelector = () => {
      return (
         <Modal
            transparent
            animationType="fade"
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
         >
            <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
               <BlurView intensity={80} tint="light" style={styles.popup} onStartShouldSetResponder={() => true}>
                  <Picker
                     selectedValue={selectedInput}
                     style={styles.picker}
                     onValueChange={(val) => setSelectedInput(val)}
                  >
                     <Picker.Item label="Default Mic" value="default" />
                     <Picker.Item label="Earpiece Mic" value="earpiece" />
                  </Picker>
               </BlurView>
            </Pressable>
         </Modal>
      )
   }

   const renderModeSelector = () => {
      if (!showModeSelector) return null;

      return (
         <Pressable
            style={styles.overlay}
            onPress={toggleModeSelector}
         >

            <BlurView intensity={80} tint="light" style={styles.modeSelectorContainer}>
               <TouchableOpacity
                  style={[styles.modeOption, { backgroundColor: 'transparent' }]}
                  onPress={(e) => {
                     e.stopPropagation()
                     selectMode(true)
                  }}
               >
                  <View style={styles.modeOptionContent}>
                     {isMinimalMode ? (
                        <Check color="#007AFF" size={20} />
                     ) : (
                        <Square color="#8E8E93" size={20} />
                     )}
                     <Text style={[styles.modeText, isMinimalMode && styles.modeTextActive]}>
                        {t("home.minimal")}
                     </Text>
                  </View>
                  <Square color="#8E8E93" size={16} />
               </TouchableOpacity>

               <View style={styles.modeSeparator} />

               <TouchableOpacity
                  style={[styles.modeOption, { backgroundColor: 'transparent' }]}
                  onPress={(e) => {
                     e.stopPropagation()
                     selectMode(false)
                  }}
               >
                  <View style={styles.modeOptionContent}>
                     {!isMinimalMode ? (
                        <Check color="#007AFF" size={20} />
                     ) : (
                        <Square color="#8E8E93" size={20} />
                     )}
                     <Text style={[styles.modeText, !isMinimalMode && styles.modeTextActive]}>
                        {t('home.detailed')}
                     </Text>
                  </View>
                  <View style={styles.detailedModeIcon}>
                     <View style={styles.detailedIconLine} />
                     <View style={styles.detailedIconLine} />
                     <View style={styles.detailedIconLine} />
                  </View>
               </TouchableOpacity>
            </BlurView>
         </Pressable>
      );
   };

   const renderRecordingButton = () => {
      let buttonContent;

      if (isProcessing) {
         buttonContent = (
            <View style={[styles.processingDots]}>
               <Bounce color='#fff' />
            </View>
         );
      } else if (isRecording) {
         buttonContent = (
            <View style={styles.audioWave}>
               <Wave color='white' />
            </View>
         );
      } else {
         buttonContent = (
            <View style={styles.dotsContainer}>
               <View style={styles.smallDot} />
               <View style={styles.smallDot} />
               <View style={styles.smallDot} />
               <View style={styles.smallDot} />
               <View style={styles.smallDot} />
            </View>
         );
      }

      return (
         <Animated.View
            style={[
               styles.recordingButton,
               {
                  transform: [{ scale: pulseAnim }],
               },
            ]}
         >
            <TouchableOpacity
               style={styles.recordingButtonInner}
               onPress={toggleRecording}
               disabled={isProcessing}
            >
               {buttonContent}
            </TouchableOpacity>
         </Animated.View>
      );
   };

   const renderTranslationBubble = () => {
      const lastMessage = messages[messages.length - 1];
      const secondLast = messages.length > 1 ? messages[messages.length - 2] : null;

      const translateY = slideAnim.interpolate({
         inputRange: [0, 1],
         outputRange: [100, 0],
      });

      const opacity = slideAnim.interpolate({
         inputRange: [0, 1],
         outputRange: [0, 1],
      });

      return (
         <>
            {showLanguages && renderLanguages()}
            {showInputLanguages && renderInputLangSelector()}
            <Animated.View style={[
               styles.translationBubble,
               {
                  transform: [{ translateY }],
                  opacity,
               }
            ]}>
               <ImageBackground
                  source={require('@/assets/images/inner-container.png')}
                  style={styles.svgBackground}
                  resizeMode="cover"
               >
                  <View style={styles.translationContent}>
                     <View style={styles.languageHeader}>
                        {
                           inputLang === 'autoDetect' ? (
                              <View>
                                 <Text style={styles.languageLabel}>{inputLang === 'autoDetect' ? t("home.detectedLang") : t('settings.inputLanguage')}:</Text>
                                 <Text style={styles.languageName}>{inputLang === 'autoDetect' ? detectedLanguage : selectedInputLanguage.name}</Text>
                              </View>
                           ) : (
                              <View>
                                 <TouchableOpacity
                                    style={{ display: "flex", flexDirection: "row", alignItems: "center", alignContent: "center" }}
                                    onPress={toggleShowInputLanguages}>
                                    <Text style={styles.languageLabel}>{t('settings.inputLanguage')}</Text>
                                    <ChevronRight />
                                 </TouchableOpacity>
                                 <Text style={{ fontSize: 15, fontWeight: 'bold' }}>{selectedInputLanguage.name}</Text>
                              </View>
                           )
                        }
                        {
                           outputLang === 'select' && (
                              <View>
                                 <TouchableOpacity
                                    style={{ display: "flex", flexDirection: "row", alignItems: "center", alignContent: "center" }}
                                    onPress={toggleShowLanguages}>
                                    <Text style={styles.languageLabel}>{t('settings.outputLanguage')}</Text>
                                    <ChevronRight />
                                 </TouchableOpacity>
                                 <Text style={{ fontSize: 15, fontWeight: 'bold' }}>{selectedOutputLang.name}</Text>
                              </View>
                           )
                        }

                     </View>
                     {modalVisible && renderInputSelector()}
                     {showVolumeModal && renderVolume()}
                     <View style={[styles.messageContainer, isMinimalMode && styles.minimalMessageContainer]}>
                        {messages.length ? (
                           isMinimalMode ? (
                              <ScrollView showsVerticalScrollIndicator={false} style={{ overflow: "scroll" }}>
                                 {
                                    secondLast && (
                                       <Text style={[styles.secondLast]}>
                                          {secondLast.translatedText || secondLast.originalText || ""}
                                       </Text>
                                    )
                                 }
                                 <Text style={styles.translatedText}>
                                    {lastMessage.translatedText}
                                 </Text>
                              </ScrollView>
                           ) : (
                              <ScrollView ref={scrollViewRef} style={styles.detailedMessages} showsVerticalScrollIndicator={false}>
                                 {messages.map((message, index) => (
                                    <View key={index} style={styles.messageItem}>
                                       <View style={styles.messageHeader}>
                                          <Text style={[
                                             styles.messageLabel, message.who === 'user' ? styles.userLabel : styles.respondentLabel,
                                             index <= messages.indexOf(lastMessage) - 2 && styles.greyMessages
                                          ]}>
                                             {message.who === 'user' ? t('conversationDetail.you') : t('conversationDetail.respondent')}
                                          </Text>
                                          <View style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 3 }}>
                                             {
                                                (voicePlayback && message.type === 'translated') && (
                                                   <TouchableOpacity
                                                      style={styles.saveNoteButton}
                                                      disabled={playingConversationId === 'playing'}
                                                      onPress={() => {
                                                         synthesizeAndPlayText(message.translatedText || message.originalText as string, message.toLanguage as string);
                                                      }}
                                                   >
                                                      {playingConversationId === 'playing' ? <Pause size={16} color={"#c1c1c1"} /> : <Play size={16} color="#007AFF" />}
                                                   </TouchableOpacity>
                                                )
                                             }
                                             {
                                                message.type === 'translated' && (
                                                   <TouchableOpacity
                                                      style={styles.saveNoteButton}
                                                      onPress={() => saveMessageAsNote(message)}
                                                   >
                                                      <Bookmark size={16} color="#007AFF" />
                                                   </TouchableOpacity>
                                                )
                                             }
                                          </View>
                                       </View>
                                       <Text style={[
                                          styles.messageText,
                                          message.who === 'user' ? styles.userMessage : styles.respondentMessage,
                                          index <= messages.indexOf(lastMessage) - 2 && styles.greyMessages
                                       ]}>
                                          {message.type === 'original' ? message.originalText : message?.translatedText}
                                       </Text>
                                       {index < messages.length - 1 && <View style={styles.messageSpacer} />}
                                    </View>
                                 ))}
                              </ScrollView>
                           )
                        ) : (
                           <Text style={[styles.secondLast]}>
                              {t('home.tapToListen')}
                           </Text>
                        )}
                     </View>
                  </View>
               </ImageBackground>
            </Animated.View>
         </>
      );
   };

   const renderVolume = () => {
      return (
         <Modal
            transparent
            animationType="fade"
            visible={showVolumeModal}
            onRequestClose={() => setModalVisible(false)}
         >
            <Pressable
               style={styles.overlay}
               onPress={() => setShowVolumeModal(false)}
            >
               <View style={styles.popup}>
                  <Slider
                     style={{ width: 150, height: 40 }}
                     minimumValue={0}
                     maximumValue={1}
                     step={0.01}
                     value={volume}
                     onSlidingComplete={handleVolumeChange}
                  />
                  <Text>{Math.round(volume * 100)}%</Text>
               </View>
            </Pressable>
         </Modal>
      )
   }

   return (
      <SafeAreaView style={styles.container}>
         <View style={styles.content}>
            {renderTranslationBubble()}
            {showSettings && (
               <Pressable
                  style={styles.overlay}
                  onPress={toggleSettings}
               >
                  <BlurView intensity={80} tint="light" style={styles.additionalControls}>
                     <TouchableOpacity onPress={(e) => {
                        e.stopPropagation()
                        setShowVolumeModal(!showVolumeModal)
                        setShowSettings(false)
                     }} style={[styles.controlOption, { backgroundColor: 'transparent' }]}>
                        <Text style={styles.controlText}>{t("home.volume")}</Text>
                        <Volume2 color="#1C1C1E" size={20} />
                     </TouchableOpacity>
                     <View style={styles.controlSeparator} />
                     <TouchableOpacity onPress={(e) => {
                        e.stopPropagation()
                        setModalVisible(true)
                        setShowSettings(false)
                     }} style={[styles.controlOption, { backgroundColor: 'transparent' }]}>
                        <Text style={styles.controlText}>{t("home.changeMic")}</Text>
                        <Users color="#1C1C1E" size={20} />
                     </TouchableOpacity>
                  </BlurView>
               </Pressable>
            )}
            <View style={styles.recordingContainer}>
               <TouchableOpacity style={styles.leftButton} onPress={toggleSettings}>
                  <BubbleIcon width={24} height={24} fill="#1C1C1E" />
               </TouchableOpacity>

               {renderRecordingButton()}

               <TouchableOpacity style={styles.rightButton} onPress={toggleModeSelector}>
                  <MoreHorizontal color="#1C1C1E" size={24} />
               </TouchableOpacity>
            </View>
            {!showSettings && renderModeSelector()}

         </View>
      </SafeAreaView>
   );
}

const styles = StyleSheet.create({
   overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0)', // Semi-transparent
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000000000,
      width: '100%'
   },
   overlayPressable: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
   },
   container: {
      flex: 1,
      backgroundColor: 'white',
   },
   content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
      backgroundColor: "#fff",
      position: "relative",
   },
   popup: {
      position: "absolute",
      bottom: 195, // adjust to position above the button
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      padding: 10,
      left: 0,
      borderRadius: 8,
      elevation: 5,
      shadowColor: "#000",
      shadowOpacity: 0.2,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      alignItems: "center",
      display: "flex",
      flexDirection: "row",
      zIndex: 5555
   },
   label: { marginBottom: 10, fontWeight: "bold" },
   picker: { height: 50, width: 200 },
   translationBubble: {
      backgroundColor: "#fff",
      width: "100%",
      height: "100%",
      borderRadius: 54,
      paddingVertical: 10,
      paddingHorizontal: 5,
      marginBottom: 40,
      minHeight: height * 0.55,
      flex: 1,
      position: 'relative',
      overflow: 'hidden',
   },
   languageHeader: {
      marginBottom: 20,
      // backgroundColor: "#fff",
      display: "flex",
      flexDirection: "row",
      alignContent: "center",
      justifyContent: "space-between"
   },
   languageLabel: {
      fontSize: 14,
      color: '#8E8E93',
      marginBottom: 4,
   },
   languageName: {
      fontSize: 15,
      fontWeight: '600',
      color: '#1C1C1E',
   },
   messageContainer: {
      flex: 1,
      display: "flex",
      flexDirection: "row",
      justifyContent: 'center',
      // backgroundColor: "#fff",
      alignSelf: "center",
      alignItems: "flex-end",
      paddingHorizontal: 15,
      minWidth: "100%",
      borderRadius: 20,
   },

   minimalMessageContainer: {
      alignItems: "center",
   },
   translatedText: {
      fontSize: 28,
      fontWeight: '600',
      color: '#1C1C1E',
      textAlign: 'center',
      lineHeight: 36,
      marginBottom: 16
   },
   secondLast: {
      fontSize: 28,
      fontWeight: '600',
      color: '#c1c1c1',
      textAlign: 'center',
      lineHeight: 36,
      marginBottom: 16,
      alignSelf: 'center'
   },
   greyMessages: {
      color: "#c1c1c1"
   },
   detailedMessages: {
      flex: 1,
   },
   messageItem: {
      marginBottom: 16,
   },
   messageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
   },
   saveNoteButton: {
      padding: 4,
      borderRadius: 4,
      backgroundColor: 'rgba(0, 122, 255, 0.1)',
   },
   messageLabel: {
      fontSize: 14,
      // color: '#8E8E93',
      marginBottom: 4,
   },
   userLabel: {
      alignSelf: "flex-end",
      justifyContent: "flex-end",
      alignContent: "flex-end",
      textAlign: "right",
      width: "100%"
   },
   respondentLabel: {
      color: '#007AFF',
   },
   messageText: {
      fontSize: 22,
      lineHeight: 24,
      fontWeight: '500',
   },
   userMessage: {
      color: '#1C1C1E',
      alignSelf: "flex-end"

   },
   respondentMessage: {
      color: '#007AFF',
   },
   messageSpacer: {
      height: 8,
   },
   recordingContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'flex-end',
      gap: 10,
      paddingHorizontal: 20,
      marginBottom: 20,
   },
   leftButton: {
      width: 50,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: "#F6F6F6",
      padding: 1,
      borderRadius: "100%"
   },
   dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 2,
   },
   smallDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#ffffff',
      margin: 1,
   },
   recordingButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#52A3EF',
      borderWidth: 6,
      borderColor: '#0084FF1A',
      justifyContent: 'center',
      alignItems: 'center',
   },
   processing: {
      backgroundColor: "#52A3EF"
   },
   recordingButtonInner: {
      width: '100%',
      height: '100%',
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
   },
   rightButton: {
      width: 50,
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: "#F6F6F6",
      padding: 1,
      borderRadius: "100%"
   },
   processingDots: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
   },
   dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#ffffff',
   },
   audioWave: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
   },
   waveBar: {
      width: 3,
      backgroundColor: '#ffffff',
      borderRadius: 1.5,
   },
   waveBar1: { height: 8 },
   waveBar2: { height: 16 },
   waveBar3: { height: 12 },
   waveBar4: { height: 20 },
   waveBar5: { height: 8 },
   modeSelectorContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderRadius: 12,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      position: "absolute",
      bottom: 85,
      right: 0,
      minWidth: 200,
      zIndex: 99999999

   },
   modeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
   },
   modeOptionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
   },
   modeText: {
      fontSize: 16,
      color: '#1C1C1E',
   },
   modeTextActive: {
      color: '#007AFF',
      fontWeight: '500',
   },
   modeSeparator: {
      height: 1,
      backgroundColor: '#E5E5EA',
      marginHorizontal: 16,
   },
   detailedModeIcon: {
      gap: 2,
   },
   detailedIconLine: {
      width: 12,
      height: 2,
      backgroundColor: '#8E8E93',
      borderRadius: 1,
   },
   additionalControls: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      position: "absolute",
      bottom: 85,
      zIndex: 10000,
      minWidth: 200,
      left: 10
   },
   controlOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
   },
   controlText: {
      fontSize: 16,
      color: '#1C1C1E',
   },
   controlSeparator: {
      height: 1,
      backgroundColor: '#E5E5EA',
      marginHorizontal: 16,
   },
   svgBackground: {
      flex: 1,
      width: '100%',
      height: '100%',
   },
   translationContent: {
      position: 'relative',
      zIndex: 1, // Ensure it's above the SVG background
      flex: 1,
      borderRadius: 20,
      padding: 15,
      display: "flex",
      flexDirection: "column"
   },
});
