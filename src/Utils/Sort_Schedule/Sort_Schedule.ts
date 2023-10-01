import { INTF_SchedulesInfo } from '../../Interface/Schedules_Info/Schedules_Info';

export const sort_schedule = ({
    schedule,
}: {
    schedule: INTF_SchedulesInfo[];
}): INTF_SchedulesInfo[] => {
    schedule.sort((a, b) => {
        const nameA = new Date(a?.time as Date) || '';
        const nameB = new Date(b?.time as Date) || '';

        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }
        return 0;
    });

    return schedule;
};
