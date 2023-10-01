export const find_max_number = ({
    data,
}: {
    data: number[];
}): number | null => {
    if (!Array.isArray(data)) {
        return null;
    }
    if (data.length === 0) {
        return null;
    }
    let maxNumber = data[0];
    for (let i = 1; i < data.length; i++) {
        if (data[i] > maxNumber) {
            maxNumber = data[i];
        }
    }
    return maxNumber;
};
