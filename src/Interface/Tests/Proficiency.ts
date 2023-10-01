import { INTF_AssignedLevel } from '../Assigned_Class/Assigned_Class';

export type INTF_ProficiencyTest = {
    id: number;
    englishLevel: INTF_AssignedLevel;
    question: {
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
};

export type INTF_ProficiencyAnswers = { id: number; answers_index: number[] };
