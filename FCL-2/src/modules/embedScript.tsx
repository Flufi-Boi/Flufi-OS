import { Component, FunctionalComponent } from "preact";

interface EmbedScriptProps {
    content: string;
}

export const EmbedScript: FunctionalComponent<EmbedScriptProps> = ({ content }) => {
    return (
        <>
            <script src={`data:text/javascript;charset=utf-8,${encodeURIComponent(content.trim())}`}></script>
        </>
    )
}
