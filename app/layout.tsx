import type {Metadata} from 'next';
import './globals.css';
import './kika-theme.css';
import {MotionController} from '../components/motion-preferences';
export const metadata:Metadata={title:'Delícias da Kika • Comida feita com amor',description:'Seu almoço com gostinho de casa. Monte sua marmita no Delícias da Kika.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><MotionController/>{children}</body></html>}
