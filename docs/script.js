(async () => {
    let expanded = {};

    async function main() {
        const notes = await getNotes();
        await renderNotes(notes);
    }

    async function getNotes(hash) {
        let query = hash ?? location.hash.replace(/^.*?\=/, '');
        if (query === '') query = "Won's notes";
        query = decodeURIComponent(query);

        let noteIds = query.split('/');
        const lastNoteId = noteIds[noteIds.length - 1];
        if (noteIds.length > 1) {
            const index = noteIds.findIndex(p => p === lastNoteId)
            if (index !== noteIds.length - 1)
                noteIds = noteIds.splice(0, index + 1);
        }

        const notes = [];
        for (let index = 0; index < noteIds.length; index++) {
            const noteBaseLink = noteIds.slice(0, index + 1).join('/');
            var markdown = await fetchNote(noteIds[index]);
            const linkfiedMarkdown = markdown.replace(new RegExp(/\[\[([^\][]*)]]/g), (match) => {
                const link = match.replace('[[', '').replace(']]', '');

                return `[${link.trim()}](#notes=${encodeURIComponent(noteBaseLink + '/' + link.trim())})`;
            });

            let note = window.markdownit().render(linkfiedMarkdown);
            note = note.replace("<h2>Backlinks</h2>", "<h2 class='backlinks'>Backlinks</h2>");
            notes.push(note.toString());
        }

        return notes;
    }

    async function fetchNote(noteId) {
        try {
            const result = await fetch(`/data/${encodeURIComponent(noteId.replace(new RegExp(/\s/g), '-'))}.json`);
            const json = await result.json();

            return json.content;
        } catch {
            return `# ${noteId} \nThis note has not been published here, yet. It maybe in progress or you do not have access.`;
        }
    }

    async function renderNotes(notes) {
        const notesContainer = document.getElementById('note-list');
        let collapsedCount = Math.floor((notes.length * 415 - document.body.clientWidth) / 451);
        console.log(collapsedCount);

        notesContainer.innerHTML = `
            ${notes.map((note, i) => {
                if (i < collapsedCount && !expanded[i]) {
                    const header = note.match(/<h1>([^<]*)<\/h1>/);
                    
                    return `<div class="collapsed" style="left: ${i * 51}px"><div class="collapsedHeading" data-index="${i}">${header}</div></div>`;
                }
                return `<div class="noteContainer"><div class="note">${note}</div></div>`;
            }).join('')}
        `;
        collapsedCount = collapsedCount - Object.keys(expanded).length;
        notesContainer.style.width = `${(notes.length * 451) - (collapsedCount * 451)}px`;
        notesContainer.style.paddingLeft = `${collapsedCount * 51}px`;

        document.body.scrollTo(document.body.scrollWidth, 0);
        const collapsedHeadings = notesContainer.querySelectorAll('.collapsedHeading');
        collapsedHeadings.forEach(p => {
            p.addEventListener('click', async (event) => {
                const index = event.currentTarget.dataset.index;
                expanded[index] = true;
                await renderNotes(notes);
                document.body.scrollTo(0, 0);
            });
        })

        const links = notesContainer.querySelectorAll('a');
        for (let link of links) {
            link.addEventListener('click', async (event) => {
                event.preventDefault();
                window.location.hash = event.currentTarget.href.replace(`${window.location.origin}/#`, '');

                expanded = {};
                const notes = await getNotes();
                await renderNotes(notes);
            });
        }
    }

    if (document.readyState !== 'loading') {
        main();
    } else {
        document.addEventListener('DOMContentLoaded', main);
    }
})();
