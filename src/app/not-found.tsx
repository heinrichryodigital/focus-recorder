import Link from 'next/link';
import {Header,Footer} from '@/components/chrome';
export default function NotFound(){return <><Header/><main id="main" className="not-found"><span className="eyebrow">404 · A LITTLE OUT OF FRAME</span><h1>Let’s refocus.</h1><p>That page isn’t here. Head back to the start and we’ll help you find your way.</p><Link className="button button-orange" href="/">Back to Focus</Link></main><Footer/></>}
