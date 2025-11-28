import MoodIcon from '@mui/icons-material/Mood';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';

// --- TONE CONFIGURATION DATA ---
export const REVISION_TONES = [
    { value: '', label: 'Default (Formal)', icon: <BusinessCenterIcon size={"small"} /> },
    { value: 'playful', label: 'Playful', icon: <MoodIcon size={"small"} /> },
    { value: 'professional', label: 'Professional', icon: <BusinessCenterIcon size={"small"} /> },
    { value: 'romantic', label: 'Romantic', icon: <FavoriteIcon size={"small"} /> },
    { value: 'sexy', label: 'Sexy', icon: <SelfImprovementIcon size={"small"} /> },
    { value: 'angry', label: 'Angry', icon: <SentimentVeryDissatisfiedIcon size={"small"} /> },
    { value: 'chill', label: 'Chill', icon: <ThermostatIcon size={"small"} /> },
    { value: 'bold', label: 'Bold', icon: <FlashOnIcon size={"small"} /> },
];
