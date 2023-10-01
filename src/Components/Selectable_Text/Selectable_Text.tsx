import React, {
    useRef,
    useEffect,
    useState,
    useCallback,
    FunctionComponent,
} from 'react';
import { Text, LayoutChangeEvent } from 'react-native';
import { fonts } from '../../Configs/Fonts/Fonts';
import Colors from '../../Configs/Colors/Colors';
import { screen_width_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import { TranslateStore } from '../../MobX/Translate/Translate';
import { observer } from 'mobx-react';

interface SelectableTextProps {
    inputText: string;
    textWeight?: 300 | 400 | 500 | 600 | 700;
    textFamily?: string;
    textSize?: number;
    textColor?: string;
    marginTop?: number | 'auto';
    marginBottom?: number | 'auto';
    marginLeft?: number | 'auto';
    marginRight?: number | 'auto';
    backgroundColor?: string;
    textAlign?: 'auto' | 'center' | 'left' | 'right' | 'justify';
    width?: number;
}
interface WordInfo {
    word: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

const useWordLayout = (callback: (wordInfo: WordInfo[]) => void) => {
    const wordRefs = useRef<(Text | null)[]>([]);
    const [wordInfo, setWordInfo] = useState<WordInfo[]>([]);

    const handleTextLayout = useCallback(
        (index: number) => (event: LayoutChangeEvent) => {
            const { x, y, width, height } = event.nativeEvent.layout;
            const updatedWordInfo = [...wordInfo];
            updatedWordInfo[index] = {
                word:
                    wordRefs.current[index]?.props?.children?.toString() ?? '',
                x,
                y,
                width,
                height,
            };
            setWordInfo(updatedWordInfo);
        },
        [wordInfo],
    );

    useEffect(() => {
        callback(wordInfo);
    }, [wordInfo, callback]);

    return { wordRefs, handleTextLayout };
};

const SelectableText: FunctionComponent<SelectableTextProps> = observer(
    ({
        inputText,
        textWeight,
        textFamily,
        textSize,
        textColor,
        backgroundColor,
        marginTop,
        marginBottom,
        marginLeft,
        marginRight,
        textAlign,
        width,
    }) => {
        const [wordIndex, setWordIndex] = useState<number | null>(null);
        const words = inputText.split(' ');
        const { wordRefs, handleTextLayout } = useWordLayout(_wordInfo => {});

        const handlePress = (index: number) => {
            const word = words[index];
            setWordIndex(index);
            const p_word = word
                ?.replace(',', '')
                ?.replace('.', '')
                ?.replace(':', '')
                ?.replace(';', '')
                ?.replace('?', '');
            TranslateStore.translate_word({ word: p_word });
        };

        const is_translate_open: boolean = TranslateStore.t_show || false;
        useEffect(() => {
            if (!is_translate_open) {
                setWordIndex(null);
            }
        }, [is_translate_open]);

        return (
            <Text
                style={{
                    fontFamily: textFamily
                        ? textFamily
                        : textWeight === 700
                        ? fonts.Urbanist_700
                        : textWeight === 600
                        ? fonts.Urbanist_600
                        : fonts.Urbanist_500,
                    color: textColor || Colors.Dark,
                    marginLeft: marginLeft || 0,
                    marginRight: marginRight || 0,
                    marginTop: marginTop || 0,
                    marginBottom: marginBottom || 0,
                    fontSize: screen_width_less_than({
                        if_true: (textSize || 14) - 2,
                        if_false: textSize || 14,
                    }),
                    backgroundColor: backgroundColor || undefined,
                    textAlign: textAlign || 'auto',
                    width: width || undefined,
                    maxWidth: width || undefined,
                }}>
                {words.map((word, index) => (
                    <Text
                        style={{
                            color:
                                wordIndex === index
                                    ? Colors.Primary
                                    : textColor || Colors.Dark,
                        }}
                        key={index}
                        ref={ref => (wordRefs.current[index] = ref)}
                        onPress={() => handlePress(index)}
                        onLayout={handleTextLayout(index)}>
                        {word}
                        {index !== words.length - 1 ? ' ' : ''}
                    </Text>
                ))}
            </Text>
        );
    },
);

export default SelectableText;
