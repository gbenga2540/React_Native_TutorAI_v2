import React, {
    Fragment,
    FunctionComponent,
    useRef,
    useState,
    useEffect,
    useCallback,
} from 'react';
import { Text, LayoutChangeEvent } from 'react-native';
import Colors from '../../Configs/Colors/Colors';
import { fonts } from '../../Configs/Fonts/Fonts';
import { screen_width_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';
import { TranslateStore } from '../../MobX/Translate/Translate';

interface HighlightedTextProps {
    text: string;
    highlight: string[];
    textWeight?: 300 | 400 | 500 | 600 | 700;
    textSize?: number;
    textColor?: string;
    hightLightTextColor?: string;
    backgroundColor?: string;
    marginTop?: number | 'auto';
    marginBottom?: number | 'auto';
    marginLeft?: number | 'auto';
    marginRight?: number | 'auto';
    textAlign?: 'auto' | 'center' | 'left' | 'right' | 'justify';
    width?: number;
    enable_ttv?: boolean;
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

const HighlightedText: FunctionComponent<HighlightedTextProps> = ({
    text,
    highlight,
    textWeight,
    textSize,
    textColor,
    hightLightTextColor,
    backgroundColor,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    textAlign,
    width,
    enable_ttv,
}) => {
    const words = text.split(' ');
    const { wordRefs, handleTextLayout } = useWordLayout(_wordInfo => {});

    const handlePress = (word: string) => {
        if (enable_ttv || false) {
            const p_word = word
                ?.replace(',', '')
                ?.replace('.', '')
                ?.replace(':', '')
                ?.replace(';', '')
                ?.replace('?', '');
            TranslateStore.translate_word({ word: p_word });
        }
    };

    return (
        <Text
            style={{
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
            {words.map((word, index) => {
                const shouldHighlight = highlight.includes(word);

                return (
                    <Fragment key={index}>
                        <Text
                            key={index}
                            ref={ref => (wordRefs.current[index] = ref)}
                            onPress={() => handlePress(word)}
                            onLayout={handleTextLayout(index)}
                            style={{
                                color: shouldHighlight
                                    ? hightLightTextColor || Colors.Primary
                                    : textColor || Colors.Dark,
                                fontFamily:
                                    textWeight === 700
                                        ? fonts.Urbanist_700
                                        : textWeight === 600
                                        ? shouldHighlight
                                            ? fonts.Urbanist_700
                                            : fonts.Urbanist_600
                                        : shouldHighlight
                                        ? fonts.Urbanist_600
                                        : fonts.Urbanist_500,
                            }}>
                            {word}
                        </Text>
                        <Text> </Text>
                    </Fragment>
                );
            })}
        </Text>
    );
};

export default HighlightedText;

// import React, { Fragment, FunctionComponent } from 'react';
// import { Text } from 'react-native';
// import Colors from '../../Configs/Colors/Colors';
// import { fonts } from '../../Configs/Fonts/Fonts';
// import { screen_width_less_than } from '../../Utils/Screen_Less_Than/Screen_Less_Than';

// interface HighlightedTextProps {
//     text: string;
//     highlight: string[];
//     textWeight?: 300 | 400 | 500 | 600 | 700;
//     textFamily?: string;
//     textSize?: number;
//     textColor?: string;
//     hightLightTextColor?: string;
//     marginLeft?: number | 'auto';
//     marginRight?: number | 'auto';
//     marginTop?: number | 'auto';
//     marginBottom?: number | 'auto';
//     backgroundColor?: string;
//     textAlign?: 'auto' | 'center' | 'left' | 'right' | 'justify';
//     width?: number;
//     selectable?: boolean;
// }

// const HighlightedText: FunctionComponent<HighlightedTextProps> = ({
//     text,
//     highlight,
//     textWeight,
//     textFamily,
//     textSize,
//     textColor,
//     hightLightTextColor,
//     marginLeft,
//     marginRight,
//     marginTop,
//     marginBottom,
//     backgroundColor,
//     textAlign,
//     width,
//     selectable,
// }) => {
//     const words = text.split(' ');

//     return (
//         <Text
//             selectable={selectable || false}
//             style={
//                 textFamily
//                     ? {
//                           color: textColor || Colors.Dark,
//                           marginLeft: marginLeft || 0,
//                           marginRight: marginRight || 0,
//                           marginTop: marginTop || 0,
//                           marginBottom: marginBottom || 0,
//                           fontSize: screen_width_less_than({
//                               if_true: (textSize || 14) - 2,
//                               if_false: textSize || 14,
//                           }),
//                           backgroundColor: backgroundColor || undefined,
//                           textAlign: textAlign || 'auto',
//                           width: width || undefined,
//                           maxWidth: width || undefined,
//                       }
//                     : {
//                           color: textColor || Colors.Dark,
//                           marginLeft: marginLeft || 0,
//                           marginRight: marginRight || 0,
//                           marginTop: marginTop || 0,
//                           marginBottom: marginBottom || 0,
//                           fontSize: screen_width_less_than({
//                               if_true: (textSize || 14) - 2,
//                               if_false: textSize || 14,
//                           }),
//                           backgroundColor: backgroundColor || undefined,
//                           textAlign: textAlign || 'auto',
//                           width: width || undefined,
//                           maxWidth: width || undefined,
//                       }
//             }>
//             {words.map((word, index) => {
//                 const shouldHighlight = highlight.includes(word);

//                 return (
//                     <Fragment key={index}>
//                         <Text
//                             key={index}
//                             style={{
//                                 color: shouldHighlight
//                                     ? hightLightTextColor || Colors.Primary
//                                     : textColor || Colors.Dark,

//                                 fontFamily:
//                                     textWeight === 700
//                                         ? fonts.Urbanist_700
//                                         : textWeight === 600
//                                         ? shouldHighlight
//                                             ? fonts.Urbanist_700
//                                             : fonts.Urbanist_600
//                                         : shouldHighlight
//                                         ? fonts.Urbanist_600
//                                         : fonts.Urbanist_500,
//                             }}>
//                             {word}
//                         </Text>
//                         <Text> </Text>
//                     </Fragment>
//                 );
//             })}
//         </Text>
//     );
// };

// export default HighlightedText;
