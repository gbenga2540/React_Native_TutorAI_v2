import { INTF_AssignedLevel } from '../Assigned_Class/Assigned_Class';

interface INTF_Server_Proficiency {
    id: number;
    englishLevel: INTF_AssignedLevel;
    question: {
        word: string;
        highlight?: string[];
    };
    instruction: {
        word: string;
        highlight?: string[];
    };
    has_image?: boolean;
    image_link?: string;
    options: {
        word: string;
        highlight?: string[];
    }[];
    multiple_choice?: boolean;
    answers_index: number[];
}

interface INTF_Server_Listening {
    id: number;
    englishLevel: INTF_AssignedLevel;
    question: string;
    options: string[];
    answer_index: number;
}

interface INTF_Server_Writing {
    id: number;
    englishLevel: INTF_AssignedLevel;
    question: string[];
}

export type {
    INTF_Server_Proficiency,
    INTF_Server_Listening,
    INTF_Server_Writing,
};
