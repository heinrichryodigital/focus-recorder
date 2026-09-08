import type { Metadata } from 'next';
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google';
import './globals.css';

const display = Bricolage_Grotesque({subsets:['latin'], variable:'--font-display', display:'swap'});
const body = DM_Sans({subsets:['latin'], variable:'--font-body', display:'swap'});
export const metadata: Metadata = {
  title: {default:'Focus Recorder — Make every move worth watching.', template:'%s · Focus Recorder'},
  description:'Beautiful screen recordings with automatic zoom and smoother cursor movement. Capture locally on macOS, with a Windows preview in development.',
  robots: {index:true, follow:true},
  openGraph: {title:'Focus Recorder', description:'Your screen. A little more cinematic.', type:'website'},
};
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="en" className={`${display.variable} ${body.variable}`}><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
