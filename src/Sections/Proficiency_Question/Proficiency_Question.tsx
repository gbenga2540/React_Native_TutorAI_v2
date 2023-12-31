import React, { Dispatch, FunctionComponent, SetStateAction } from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { INTF_ProficiencyTest } from '../../Interface/Tests/Proficiency';
import HighlightedText from '../../Components/Highlighted_Text/Highlighted_Text';
import BasicText from '../../Components/Basic_Text/Basic_Text';
import { alphabets } from '../../Data/Alphabets/Alphabets';
import Colors from '../../Configs/Colors/Colors';
import { no_double_clicks } from '../../Utils/No_Double_Clicks/No_Double_Clicks';

interface ProficiencyQuestionProps {
    question: INTF_ProficiencyTest;
    marginTop?: number | 'auto';
    marginBottom?: number | 'auto';
    marginLeft?: number | 'auto';
    marginRight?: number | 'auto';
    answers: number[];
    setAnswers: Dispatch<SetStateAction<number[]>>;
    answerUI: 'NoChange' | 'Correct' | 'Wrong';
}
const ProficiencyQuestion: FunctionComponent<ProficiencyQuestionProps> = ({
    question,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    answers,
    setAnswers,
    answerUI,
}) => {
    const select_answers = no_double_clicks({
        execFunc: ({ index }: { index: number }) => {
            if (question.multiple_choice) {
                if (answers.includes(index)) {
                    setAnswers(prev => prev.filter(item => item !== index));
                } else {
                    if (answers.length === 2) {
                        setAnswers(prev => prev.filter(item => item !== index));
                    } else {
                        setAnswers([...answers, index]);
                    }
                }
            } else {
                if (answers.includes(index)) {
                    setAnswers([]);
                } else {
                    setAnswers([index]);
                }
            }
        },
    });

    return (
        <View
            style={{
                marginLeft: marginLeft || 0,
                marginRight: marginRight || 0,
                marginTop: marginTop || 0,
                marginBottom: marginBottom || 0,
            }}>
            <HighlightedText
                text={question.question.word}
                highlight={question.question.highlight || []}
                textSize={18}
            />
            <HighlightedText
                text={
                    question.multiple_choice
                        ? 'Choose two correct answers.'
                        : 'Choose one correct answer.'
                }
                highlight={question.multiple_choice ? ['two'] : ['one']}
                textSize={16}
                marginTop={4}
                marginBottom={question.has_image ? 15 : 40}
            />
            {question.has_image && (
                <Image
                    source={{
                        uri: question.image_link as string,
                        width: 150,
                        height: 150,
                    }}
                    style={{
                        marginBottom: 25,
                        width: 150,
                        height: 150,
                        borderRadius: 150,
                    }}
                />
            )}
            {question?.options?.map((item, index) => (
                <TouchableOpacity
                    key={index}
                    onPress={() => select_answers({ index: index })}
                    style={{
                        flexDirection: 'row',
                        borderWidth: 1,
                        marginBottom: 8,
                        padding: 5,
                        borderColor: answers?.includes(index)
                            ? answerUI === 'Wrong'
                                ? Colors.Red
                                : answerUI === 'Correct'
                                ? Colors.Green3
                                : Colors.Primary
                            : Colors.Grey,
                        borderRadius: 10,
                        backgroundColor: answers?.includes(index)
                            ? answerUI === 'Wrong'
                                ? Colors.Red
                                : answerUI === 'Correct'
                                ? Colors.Green3
                                : Colors.Primary
                            : undefined,
                        paddingVertical: 5,
                        minHeight: 51,
                        alignItems: 'center',
                    }}>
                    <BasicText
                        inputText={alphabets[index]}
                        marginRight={10}
                        marginLeft={3}
                        textWeight={700}
                        textSize={20}
                        textColor={
                            answers?.includes(index)
                                ? Colors.White
                                : Colors.Dark
                        }
                    />
                    <View style={{ flex: 1 }}>
                        <HighlightedText
                            text={item.word}
                            highlight={item.highlight || []}
                            textSize={17}
                            textColor={
                                answers?.includes(index)
                                    ? Colors.White
                                    : Colors.Dark
                            }
                            hightLightTextColor={
                                answers?.includes(index)
                                    ? Colors.LightGrey
                                    : Colors.Primary
                            }
                        />
                    </View>
                </TouchableOpacity>
            ))}
        </View>
    );
};
export default ProficiencyQuestion;
