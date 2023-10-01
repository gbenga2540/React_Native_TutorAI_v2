import React, {
    Dispatch,
    FunctionComponent,
    SetStateAction,
    useEffect,
    useState,
} from 'react';
import {
    View,
    TouchableOpacity,
    Platform,
    KeyboardAvoidingView,
    InputModeOptions,
    TextInput,
    StyleSheet,
    Pressable,
    PermissionsAndroid,
} from 'react-native';
import AudioRecorderPlayer, {
    AVEncoderAudioQualityIOSType,
    AVEncodingOption,
    AudioEncoderAndroidType,
    AudioSet,
    AudioSourceAndroidType,
    OutputFormatAndroidType,
} from 'react-native-audio-recorder-player';
import { CachesDirectoryPath } from 'react-native-fs';
import { seconds_to_minutes } from '../../Utils/Seconds_To_Minutes/Seconds_To_Minutes';
import BasicText from '../Basic_Text/Basic_Text';
import { DebouncedFuncLeading } from 'lodash';
import Colors from '../../Configs/Colors/Colors';
import Feather from 'react-native-vector-icons/Feather';
import { fonts } from '../../Configs/Fonts/Fonts';
import { TextToSpeechStore } from '../../MobX/Text_To_Speech/Text_To_Speech';
import { GoogleSpeechToText } from '../../Hooks/Google_Speech_To_Text/Google_Speech_To_Text';

const audioRecorderPlayer = new AudioRecorderPlayer();
audioRecorderPlayer.setSubscriptionDuration(1);

const mic_size = 60;
interface MicAndTextInputProps {
    marginTop?: number | 'auto';
    marginBottom?: number | 'auto';
    paddingTop?: number | string;
    paddingBottom?: number | string;
    marginLeft?: number | 'auto';
    marginRight?: number | 'auto';
    marginHorizontal?: number | 'auto';
    inputValue: string;
    placeHolderText?: string;
    setInputValue: Dispatch<SetStateAction<string>>;
    inputMode?: InputModeOptions;
    onFocus?: DebouncedFuncLeading<() => void>;
    onChange?: DebouncedFuncLeading<() => void>;
    autoFocus?: boolean;
    editable?: boolean;
    textColor?: string;
    onSend: ({ textInput }: { textInput: string }) => void;
    mode: 'Mic_And_Text' | 'Mic_Only' | 'TextInput_Only' | 'None';
}

const MicAndTextInput: FunctionComponent<MicAndTextInputProps> = ({
    marginTop,
    marginBottom,
    paddingTop,
    paddingBottom,
    marginLeft,
    marginRight,
    marginHorizontal,
    inputValue,
    placeHolderText,
    setInputValue,
    inputMode,
    onFocus,
    onChange,
    autoFocus,
    editable,
    textColor,
    onSend,
    mode,
}) => {
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [recordingPaused, setRecordingPaused] = useState<boolean>(false);
    const [recordTime, setRecordTime] = useState<number>(0);
    const [audioText, setAudioText] = useState<string>('');
    const [disableButton, setDisableButton] = useState<boolean>(false);

    const path = Platform.select({
        ios: 'tutorAI.m4a',
        android: `${CachesDirectoryPath}/tutorAI.mp3`,
    });

    const start_recording = async () => {
        setAudioText('');
        TextToSpeechStore.clear_speech();
        const audioSet: AudioSet = {
            AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
            AudioSourceAndroid: AudioSourceAndroidType.MIC,
            AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.medium,
            AVNumberOfChannelsKeyIOS: 2,
            AVFormatIDKeyIOS: AVEncodingOption.aac,
            OutputFormatAndroid: OutputFormatAndroidType.AAC_ADTS,
        };

        await audioRecorderPlayer.startRecorder(path, audioSet);
        setIsRecording(true);
        setRecordingPaused(false);

        audioRecorderPlayer.addRecordBackListener(_e => {
            setRecordTime(prev => prev + 1);
        });
    };

    const pause_recording = async () => {
        if (recordingPaused) {
            await audioRecorderPlayer.resumeRecorder();
            setRecordingPaused(false);
        } else {
            await audioRecorderPlayer.pauseRecorder();
            setRecordingPaused(true);
        }
    };

    const delete_recording = async () => {
        await audioRecorderPlayer.stopRecorder();
        setIsRecording(false);
        setRecordTime(0);
        audioRecorderPlayer.removeRecordBackListener();
        setAudioText('');
    };

    const onMicSend = async () => {
        if (audioText) {
            onSend({ textInput: audioText });
            setIsRecording(false);
            setAudioText('');
        } else {
            setDisableButton(true);
            const file_path = await audioRecorderPlayer.stopRecorder();
            audioRecorderPlayer.removeRecordBackListener();
            const audioRecording = await GoogleSpeechToText({
                audioPath: file_path as string,
            });
            if (audioRecording) {
                setAudioText(audioRecording as string);
            }
            setRecordTime(0);
            setDisableButton(false);
        }
    };

    useEffect(() => {
        const stop_mic = async () => {
            await audioRecorderPlayer.stopRecorder();
            setIsRecording(false);
            setRecordTime(0);
            audioRecorderPlayer.removeRecordBackListener();
        };
        stop_mic();
    }, [mode]);

    useEffect(() => {
        const check_permissions = async () => {
            if (Platform.OS === 'android') {
                try {
                    const grants = await PermissionsAndroid.requestMultiple([
                        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
                        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                    ]);

                    if (
                        grants['android.permission.WRITE_EXTERNAL_STORAGE'] ===
                            PermissionsAndroid.RESULTS.GRANTED &&
                        grants['android.permission.READ_EXTERNAL_STORAGE'] ===
                            PermissionsAndroid.RESULTS.GRANTED &&
                        grants['android.permission.RECORD_AUDIO'] ===
                            PermissionsAndroid.RESULTS.GRANTED
                    ) {
                        return;
                    } else {
                        return;
                    }
                } catch (err) {
                    return;
                }
            }
        };

        check_permissions();
    }, []);

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'position' : 'height'}>
            <View
                style={{
                    flexDirection: 'row',
                    marginTop: marginTop || 0,
                    marginBottom: marginBottom || 0,
                    marginLeft: marginLeft || 0,
                    marginRight: marginRight || 0,
                    marginHorizontal: marginHorizontal || 0,
                    paddingTop: paddingTop || 0,
                    paddingBottom: paddingBottom || 0,
                    justifyContent: 'flex-end',
                    backgroundColor: Colors.Background,
                }}>
                {mode === 'TextInput_Only' && (
                    <View style={{ flexDirection: 'row', flex: 1 }}>
                        <View
                            style={{
                                flexDirection: 'row',
                                minHeight: 56,
                                maxHeight: 110,
                                borderRadius: 8,
                                borderColor: Colors.Border,
                                borderWidth: 1,
                                backgroundColor: Colors.InputBackground,
                                flex: 1,
                                marginRight: 10,
                                marginBottom: 2,
                            }}>
                            <TextInput
                                style={[
                                    styles.s_t_e_m_ti,
                                    { color: textColor || Colors.Dark },
                                ]}
                                placeholder={placeHolderText || ''}
                                placeholderTextColor={Colors.Grey}
                                onChangeText={(text: string) => {
                                    setInputValue(text);
                                    onChange !== undefined &&
                                        (onChange() as unknown);
                                }}
                                value={inputValue}
                                autoCapitalize={'none'}
                                autoCorrect={false}
                                inputMode={inputMode || 'text'}
                                onFocus={() =>
                                    onFocus !== undefined &&
                                    (onFocus() as unknown)
                                }
                                autoFocus={autoFocus || false}
                                editable={editable === false ? false : true}
                                multiline
                                autoComplete={'off'}
                                importantForAutofill="no"
                                spellCheck={false}
                                keyboardType="visible-password"
                                secureTextEntry
                            />
                        </View>
                        <TouchableOpacity
                            onPress={() => onSend({ textInput: inputValue })}
                            activeOpacity={0.55}
                            disabled={!inputValue}
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: 56,
                                backgroundColor: inputValue
                                    ? Colors.Primary
                                    : Colors.LightPurple3,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}>
                            <Feather
                                name="send"
                                size={24}
                                color={Colors.White}
                            />
                        </TouchableOpacity>
                    </View>
                )}
                {mode === 'Mic_Only' && (
                    <View
                        style={{
                            flex: 1,
                            alignItems: isRecording ? undefined : 'center',
                            justifyContent: 'flex-end',
                            minHeight: 80,
                        }}>
                        {!isRecording && (
                            <Pressable
                                onPress={start_recording}
                                style={[
                                    styles.pressable,
                                    {
                                        width: mic_size,
                                        height: mic_size,
                                        borderRadius: mic_size,
                                        zIndex: 3,
                                    },
                                ]}>
                                <View
                                    style={[
                                        styles.background,
                                        {
                                            borderRadius: mic_size,
                                        },
                                    ]}
                                />
                                <Feather
                                    name="mic"
                                    size={Math.round(mic_size / 2.67)}
                                    style={[
                                        {
                                            position: 'absolute',
                                            color: Colors.Primary,
                                        },
                                    ]}
                                />
                            </Pressable>
                        )}
                        {isRecording && (
                            <View>
                                {audioText ? (
                                    <BasicText
                                        inputText={audioText}
                                        marginLeft={'auto'}
                                        marginRight={'auto'}
                                        textWeight={700}
                                    />
                                ) : (
                                    <BasicText
                                        inputText={seconds_to_minutes({
                                            time: recordTime,
                                        })}
                                        marginLeft={'auto'}
                                        marginRight={'auto'}
                                        textWeight={700}
                                    />
                                )}

                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        marginTop: 5,
                                    }}>
                                    <TouchableOpacity
                                        onPress={delete_recording}
                                        disabled={disableButton}
                                        activeOpacity={0.55}
                                        style={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 56,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}>
                                        <Feather
                                            name="trash"
                                            size={24}
                                            color={Colors.Red}
                                        />
                                    </TouchableOpacity>
                                    {!audioText && (
                                        <>
                                            <TouchableOpacity
                                                onPress={pause_recording}
                                                disabled={disableButton}
                                                activeOpacity={0.55}
                                                style={{
                                                    width: 56,
                                                    height: 56,
                                                    borderRadius: 56,
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                }}>
                                                {recordingPaused ? (
                                                    <Feather
                                                        name="play"
                                                        size={24}
                                                        color={Colors.Grey}
                                                    />
                                                ) : (
                                                    <Feather
                                                        name="pause"
                                                        size={24}
                                                        color={Colors.Grey}
                                                    />
                                                )}
                                            </TouchableOpacity>
                                        </>
                                    )}
                                    <TouchableOpacity
                                        onPress={onMicSend}
                                        disabled={disableButton}
                                        activeOpacity={0.55}
                                        style={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 56,
                                            backgroundColor: Colors.Primary,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}>
                                        <Feather
                                            name="send"
                                            size={24}
                                            color={Colors.White}
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                )}
                {mode === 'Mic_And_Text' && !isRecording && (
                    <View style={{ flexDirection: 'row', flex: 1 }}>
                        <View
                            style={{
                                flexDirection: 'row',
                                minHeight: 56,
                                maxHeight: 110,
                                borderRadius: 8,
                                borderColor: Colors.Border,
                                borderWidth: 1,
                                backgroundColor: Colors.InputBackground,
                                flex: 1,
                                marginRight: 10,
                                marginBottom: 2,
                            }}>
                            <TextInput
                                style={[
                                    styles.s_t_e_m_ti,
                                    { color: textColor || Colors.Dark },
                                ]}
                                placeholder={placeHolderText || ''}
                                placeholderTextColor={Colors.Grey}
                                onChangeText={(text: string) => {
                                    setInputValue(text);
                                    onChange !== undefined &&
                                        (onChange() as unknown);
                                }}
                                value={inputValue}
                                autoCapitalize={'none'}
                                autoCorrect={false}
                                inputMode={inputMode || 'text'}
                                onFocus={() =>
                                    onFocus !== undefined &&
                                    (onFocus() as unknown)
                                }
                                autoFocus={autoFocus || false}
                                editable={editable === false ? false : true}
                                multiline
                                autoComplete={'off'}
                                importantForAutofill="no"
                                spellCheck={false}
                                keyboardType="visible-password"
                                secureTextEntry
                            />
                        </View>
                        {inputValue ? (
                            <TouchableOpacity
                                onPress={() =>
                                    onSend({ textInput: inputValue })
                                }
                                activeOpacity={0.55}
                                disabled={!inputValue}
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 56,
                                    backgroundColor: inputValue
                                        ? Colors.Primary
                                        : Colors.LightPurple3,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                <Feather
                                    name="send"
                                    size={24}
                                    color={Colors.White}
                                />
                            </TouchableOpacity>
                        ) : (
                            <Pressable
                                onPress={start_recording}
                                style={[
                                    styles.pressable,
                                    {
                                        width: mic_size,
                                        height: mic_size,
                                        borderRadius: mic_size,
                                        zIndex: 3,
                                    },
                                ]}>
                                <View
                                    style={[
                                        styles.background,
                                        {
                                            borderRadius: mic_size,
                                        },
                                    ]}
                                />
                                <Feather
                                    name="mic"
                                    size={Math.round(mic_size / 2.67)}
                                    style={[
                                        {
                                            position: 'absolute',
                                            color: Colors.Primary,
                                        },
                                    ]}
                                />
                            </Pressable>
                        )}
                    </View>
                )}
                {mode === 'Mic_And_Text' && isRecording && (
                    <View
                        style={{
                            flex: 1,
                            alignItems: isRecording ? undefined : 'center',
                            justifyContent: 'flex-end',
                            minHeight: 80,
                        }}>
                        {audioText ? (
                            <BasicText
                                inputText={audioText}
                                marginLeft={'auto'}
                                marginRight={'auto'}
                                textWeight={700}
                            />
                        ) : (
                            <BasicText
                                inputText={seconds_to_minutes({
                                    time: recordTime,
                                })}
                                marginLeft={'auto'}
                                marginRight={'auto'}
                                textWeight={700}
                            />
                        )}
                        <View
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                marginTop: 5,
                            }}>
                            <TouchableOpacity
                                onPress={delete_recording}
                                activeOpacity={0.55}
                                disabled={disableButton}
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 56,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                <Feather
                                    name="trash"
                                    size={24}
                                    color={Colors.Red}
                                />
                            </TouchableOpacity>
                            {!audioText && (
                                <>
                                    <TouchableOpacity
                                        onPress={pause_recording}
                                        activeOpacity={0.55}
                                        disabled={disableButton}
                                        style={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 56,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                        }}>
                                        {recordingPaused ? (
                                            <Feather
                                                name="play"
                                                size={24}
                                                color={Colors.Grey}
                                            />
                                        ) : (
                                            <Feather
                                                name="pause"
                                                size={24}
                                                color={Colors.Grey}
                                            />
                                        )}
                                    </TouchableOpacity>
                                </>
                            )}
                            <TouchableOpacity
                                onPress={onMicSend}
                                disabled={disableButton}
                                activeOpacity={0.55}
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 56,
                                    backgroundColor: Colors.Primary,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                <Feather
                                    name="send"
                                    size={24}
                                    color={Colors.White}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
                {mode === 'None' && null}
            </View>
        </KeyboardAvoidingView>
    );
};

export default MicAndTextInput;

const styles = StyleSheet.create({
    pressable: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.LightPrimary,
    },
    background: {
        backgroundColor: Colors.Primary,
        position: 'absolute',
    },
    s_t_e_m_ti: {
        flex: 1,
        fontFamily: fonts.Urbanist_500,
        fontSize: 16,
        marginHorizontal: 18,
        borderWidth: 0,
        marginVertical: 2,
    },
});
