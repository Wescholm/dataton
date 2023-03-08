import { DataTypes } from 'sequelize';

// Columns id, createdAt, updatedAt are added automatically

export const GOOGLE_PLACES_MODEL = {
    placeId: DataTypes.STRING,
    country: DataTypes.STRING
}