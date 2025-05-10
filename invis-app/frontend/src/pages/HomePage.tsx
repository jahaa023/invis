import logo from "../../public/favicon.svg";
import shield from "../../public/icons/shield.svg"
import dollar from "../../public/icons/dollar.svg"
import globe from "../../public/icons/globe.svg"
import Footer from "../components/Footer";

function redirectRegister() {
    window.location.href = "/register"
}

export default function HomePage() {
    return (
        <>
            <div className="w-screen- flex items-center flex-col">
                <div className="pt-20 pb-20 flex justify-center items-center gap-8 w-[calc(100vw-100px)] px-[50px]">
                    <img className="w-90" src={logo} alt="Invis Planet Logo" />
                    <div className="float-left clear-left">
                        <h1 className="text-4xl font-bold bg-[linear-gradient(to_right,_var(--color-brand),_var(--color-brand-alt))] bg-clip-text text-transparent pb-2">
                            End to end encryption for your privacy.
                        </h1>
                        <p className="max-w-130 pb-2">
                            <b>Invis</b> is a private messaging service utilizing end to end encryption
                            to make sure your messages stay uncompromised.
                        </p>
                        <button 
                            className="px-2.5 py-1.5 rounded-[8px] cursor-pointer bg-[radial-gradient(circle_at_center,_#0000_20.55%,_var(--color-brand)_94.17%)] bg-brand transition-all duration-200 ease-in hover:bg-brand-alt hover:font-bold"
                            title="Get started"
                            onClick={redirectRegister}
                        >
                            Get started
                        </button>
                    </div>
                </div>
                <div className="w-[80%] h-0.5 bg-white opacity-40 mb-7"></div>
                <h1 className="text-3xl pb-7">What we can offer:</h1>
                <div className="p-6 mb-15 border-white border-solid border-2 rounded-3xl max-w-[80%] flex flex-col items-center gap-6">
                    <div className="flex items-center gap-3 max-w-[80%]">
                        <div className="p-1.5 rounded-[4rem] min-w-16 min-h-16 bg-brand flex justify-center items-center">
                            <img className="w-[80%] h-[80%}" src={shield}/>
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold">End to end encryption</h1>
                            <p className="font-light">
                                Your private messages are encrypted before they get sent over the internet, 
                                meaning that bad actors cannot read your messages as they are transferred.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 max-w-[80%]">
                        <div className="p-1.5 rounded-[4rem] min-w-16 min-h-16 bg-brand flex justify-center items-center">
                            <img className="w-[80%] h-[80%}" src={globe}/>
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold">Open source</h1>
                            <p className="font-light">
                                We are open source and all the code for Invis is publicly available on GitHub. 
                                You can visit the GitHub through <a href="https://github.com/jahaa023/invis" target="_blank">this link.</a>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 max-w-[80%]">
                        <div className="p-1.5 rounded-[4rem] min-w-16 min-h-16 bg-brand flex justify-center items-center">
                            <img className="w-[80%] h-[80%}" src={dollar}/>
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold">No ads or monetization</h1>
                            <p className="font-light">
                                Unlike ad-driven platforms, we do not sell your activity or metadata to advertisers as we are a non-profit organization.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}