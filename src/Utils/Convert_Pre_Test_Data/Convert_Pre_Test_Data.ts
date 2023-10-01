import {
    INTF_AssignedClass,
    INTF_AssignedLevel,
} from '../../Interface/Assigned_Class/Assigned_Class';
import {
    INTF_Server_Listening,
    INTF_Server_Proficiency,
    INTF_Server_Writing,
} from '../../Interface/Server_Pre_Test/Server_Pre_Test';
import {
    INTF_ListeningAnswers,
    INTF_ListeningTest,
} from '../../Interface/Tests/Listening';
import {
    INTF_ProficiencyAnswers,
    INTF_ProficiencyTest,
} from '../../Interface/Tests/Proficiency';
import {
    INTF_WritingAnswer,
    INTF_WritingTest,
} from '../../Interface/Tests/Writing';

const get_level = ({
    lvl,
}: {
    lvl: INTF_AssignedLevel;
}): INTF_AssignedClass => {
    switch (lvl) {
        case 'A2':
            return 'Beginner';
        case 'B1':
            return 'Pre-Intermediate';
        case 'B2':
            return 'Intermediate';
        case 'C1':
            return 'Upper-Intermediate';
        case 'C2':
            return 'Confident';
        default:
            return 'Beginner';
    }
};

const convert_to_ProficiencyT = ({
    data,
}: {
    data: INTF_Server_Proficiency[];
}): INTF_ProficiencyTest[] => {
    return data.map(item => {
        return {
            id: item?.id,
            englishLevel: item?.englishLevel,
            question: {
                word: item?.question?.word,
                highlight: item?.question?.highlight || [],
            },
            options: item?.options?.map(option => ({
                word: option?.word,
                highlight: option?.highlight || [],
            })),
            has_image: item?.has_image || false,
            image_link: item?.image_link || '',
            multiple_choice: item?.multiple_choice || false,
        };
    });
};

const convert_to_ProficiencyA = ({
    data,
}: {
    data: INTF_Server_Proficiency[];
}): INTF_ProficiencyAnswers[] => {
    return data.map(item => ({
        id: item.id,
        answers_index: item.answers_index,
    }));
};

const convert_to_ListeningT = ({
    data,
}: {
    data: INTF_Server_Listening[];
}): INTF_ListeningTest[] => {
    return data.map(item => ({
        englishLevel: item.englishLevel,
        id: item.id,
        level: get_level({ lvl: item.englishLevel }),
        options: item.options,
        question: item.question,
    }));
};

const convert_to_ListeningA = ({
    data,
}: {
    data: INTF_Server_Listening[];
}): INTF_ListeningAnswers[] => {
    return data.map(item => ({
        answer_index: item.answer_index,
        id: item.id,
        level: get_level({ lvl: item.englishLevel }),
    }));
};

const convert_to_writingT = ({
    data,
}: {
    data: INTF_Server_Writing[];
}): INTF_WritingTest[] => {
    return data.map(item => ({
        englishLevel: item.englishLevel,
        id: item.id,
        question: item.question.map((q, index) => `${index + 1}. ${q.trim()}`),
    }));
};

const convert_to_writingA = ({
    data,
}: {
    data: INTF_Server_Writing[];
}): INTF_WritingAnswer[] => {
    return data?.map(item => ({
        englishLevel: item.englishLevel,
        id: item.id,
        level: get_level({ lvl: item.englishLevel }),
        question: item.question.join(' '),
    }));
};

export {
    convert_to_ProficiencyT,
    convert_to_ProficiencyA,
    convert_to_ListeningT,
    convert_to_ListeningA,
    convert_to_writingT,
    convert_to_writingA,
};
