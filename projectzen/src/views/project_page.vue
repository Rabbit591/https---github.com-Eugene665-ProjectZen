<template>
  <div class="project-editor">
    <!-- Верхняя панель инструментов -->
    <div class="toolbar">
      <select v-model="fontSize" class="toolbar-item" @change="updateFontSize">
        <option value="32px">Большой заголовок</option>
        <option value="24px">Заголовок</option>
        <option value="16px">Текст</option>
      </select>
      <button class="toolbar-item" @click="applyStyle('bold')">B</button>
      <button class="toolbar-item" @click="applyStyle('italic')">I</button>
      <button class="toolbar-item" @click="applyStyle('underline')">U</button>
      <button class="toolbar-item" @click="addOrderedList">1.</button>
      <button class="toolbar-item" @click="addUnorderedList">•</button>
      <button class="toolbar-item" @click="addLink">Ссылка</button>
      <button class="toolbar-item" @click="alignText('left')">По левому краю</button>
      <button class="toolbar-item" @click="alignText('center')">По центру</button>
    </div>

    <!-- Поле для ввода названия проекта -->
    <div class="input-section">
      <input
        v-model="project.title"
        class="project-title"
        placeholder="Введите название проекта"
        required
      />
    </div>

    <!-- Поле для описания проекта -->
    <div class="input-section">
      <textarea
        v-model="project.description"
        class="project-description"
        placeholder="Введите описание проекта"
        required
      ></textarea>
    </div>

    <!-- Блоки содержимого проекта -->
    <div class="content-blocks">
      <div
        v-for="(block, index) in project.blocks"
        :key="index"
        class="content-wrapper"
        @mouseenter="showAddButtons(index)"
        @mouseleave="hideAddButtons(index)"
      >
        <div
          class="content-block"
          :style="block.type === 'text' ? { fontSize: block.fontSize, paddingRight: '10px' } : { paddingRight: '10px' }"
          contenteditable="true"
          @input="updateBlockContent($event, index)"
          @mouseup="handleBlockSelection(index)"
          @keyup="handleBlockSelection(index)"
        >
          <template v-if="block.type === 'text'" v-html="block.content"></template>
          <template v-else-if="block.type === 'photo'">
            <img :src="block.content" alt="Фото" class="photo-block" />
          </template>
        </div>
        <button @click="deleteBlock(index)" class="delete-block-button"></button>
        <div v-if="block.showButtons" class="add-inline-buttons">
          <button @click="addBlockAtIndex('text', index)" class="add-block-button">Добавить блок текста</button>
          <button @click="showPhotoOptionsAtIndex(index)" class="add-block-button">Вставить фото</button>
        </div>
        <!-- Кнопки добавления под каждым блоком -->
        <div class="add-block-buttons">
          <button @click="addBlockAtIndex('text', index)" class="add-block-button">Добавить блок текста</button>
          <button @click="showPhotoOptionsAtIndex(index)" class="add-block-button">Вставить фото</button>
        </div>
      </div>
    </div>

    <!-- Кнопка сохранения -->
    <div class="save-button">
      <button @click="postProject">Опубликовать проект</button>
    </div>

    <!-- Модальное окно для вставки фото -->
    <div v-if="showPhotoModal" class="modal">
      <div class="modal-content">
        <h3>Выберите вариант вставки</h3>
        <button @click="insertPhotoFromClipboard">Вставить фото из буфера</button>
        <button @click="insertPhotoFromGallery">Выбрать из галереи</button>
        <button @click="closePhotoModal">Отмена</button>
      </div>
    </div>
  </div>
</template>

<script>
  import { uploadImageToSupabase, addProject, fetchProjects, deleteImageFromSupabase } from "../lib/common_methods.js";
  import { inject } from "vue";
export default {
  setup () {
    const user = inject('user');
    return {
      user
    };
  },
  data() {
    return {
      fontSize: "16px",
      selection: null,
      selectedBlockIndex: null,
      showPhotoModal: false,
      project: {
        title: "",
        description: "",
        blocks: [
          { type: "text", content: "", fontSize: "16px", showButtons: false },
        ],
      },
      photoInsertIndex: null,
    };
  },
  methods: {
    applyStyle(style) {
      if (!this.selection || this.selectedBlockIndex === null) return;
      document.execCommand(style);
    },
    saveSelection(index) {
      this.selection = window.getSelection();
      this.selectedBlockIndex = index;
    },
    handleBlockSelection(index) {
      this.saveSelection(index);
      this.fontSize = this.project.blocks[index].fontSize;
    },
    updateBlockContent(event, index) {
      this.project.blocks[index].content = event.target.innerHTML;
      this.makeLinksClickable();
    },
    addBlock(type) {
      const fontSize = type === "text" ? "16px" : "";
      this.project.blocks.push({ type, content: "", fontSize, showButtons: false });
    },
    addBlockAtIndex(type, index) {
      const fontSize = type === "text" ? "16px" : "";
      this.project.blocks.splice(index + 1, 0, { type, content: "", fontSize, showButtons: false });
    },
    showPhotoOptions() {
      this.showPhotoModal = true;
      this.photoInsertIndex = this.project.blocks.length; // Вставить в конец
    },
    showPhotoOptionsAtIndex(index) {
      this.showPhotoModal = true;
      this.photoInsertIndex = index + 1; // Вставить после текущего блока
    },
    closePhotoModal() {
      this.showPhotoModal = false;
      this.photoInsertIndex = null;
    },
    async insertPhotoFromClipboard() {
     const items = await navigator.clipboard.read();
     for (const item of items) {
       const imageType = item.types.find(type => type.startsWith('image/'));
       if (imageType) {
         const blob = await item.getType(imageType);
         const imageUrl = await uploadImageToSupabase(blob, `clipboard.png`);
         if (imageUrl) {
           const newBlock = {
             type: 'photo',
             content: imageUrl,
             fontSize: "",
             showButtons: false
           };
           this.project.blocks.splice(this.photoInsertIndex, 0, newBlock);
           this.closePhotoModal();
         }
       }
     }
     input.click();
   },
     async insertPhotoFromGallery() {
       const input = document.createElement("input");
       input.type = "file";
       input.accept = "image/*";
       input.onchange = async (event) => {
         const file = event.target.files[0];
         if (file) {
           const imageUrl = await uploadImageToSupabase(file, file.name);
           if (imageUrl) {
             const newBlock = {
               type: 'photo',
               content: imageUrl,
               fontSize: "",
               showButtons: false
             };
             this.project.blocks.splice(this.photoInsertIndex, 0, newBlock);
             this.closePhotoModal();
           }
         }
       };
       input.click();
     },
    updateFontSize(event) {
      if (this.selectedBlockIndex !== null) {
        this.project.blocks[this.selectedBlockIndex].fontSize = event.target.value;
      }
    },
    addOrderedList() {
      document.execCommand("insertOrderedList");
    },
    addUnorderedList() {
      document.execCommand("insertUnorderedList");
    },
    addLink() {
      const url = prompt("Введите URL:");
      if (url) {
        document.execCommand("createLink", false, url);
        this.makeLinksClickable();
      }
    },
    alignText(alignment) {
      document.execCommand(`justify${alignment.charAt(0).toUpperCase() + alignment.slice(1)}`);
    },
    async deleteBlock(index) {
      if (this.project.blocks[index].type == 'photo') {
        const data = await deleteImageFromSupabase(this.project.blocks[index].content);
        console.log(data);
      }
      this.project.blocks.splice(index, 1);
    },
    async postProject() {
      console.log(this.project);
      console.log(JSON.stringify(this.project));
        const error = await addProject(JSON.stringify(this.project), this.user.id);
        const data = await fetchProjects();
        console.log(JSON.parse(data[0].project_data));
        console.log(data);
        if (error)
          throw error;
      
  },
    makeLinksClickable() {
      const links = document.querySelectorAll(".content-block a");
      links.forEach(link => {
        link.addEventListener("click", (event) => {
          event.preventDefault();
          window.open(link.href, '_blank');
        });
      });
    },
    showAddButtons(index) {
      this.$set(this.project.blocks[index], 'showButtons', true);
    },
    hideAddButtons(index) {
      this.$set(this.project.blocks[index], 'showButtons', false);
    },
  },
  mounted() {
    this.makeLinksClickable();
  }
};
</script>

<style scoped>
.project-editor {
  background-color: #f5f5f5;
  color: #333;
  padding: 20px;
  max-width: 800px;
  margin: auto;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.toolbar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  position: sticky;
  top: 20px; /* Увеличенный отступ сверху */
  background-color: #f5f5f5;
  z-index: 1000;
  padding-top: 10px; /* Добавим отступ сверху */
  padding-bottom: 10px; /* Добавим отступ снизу */
}

.toolbar-item {
  background-color: #fff;
  border: 1px solid #ccc;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.input-section {
  margin-bottom: 20px;
}

.project-title,
.project-description {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.content-blocks {
  margin-bottom: 20px;
}

.content-wrapper {
  position: relative;
}

.content-block {
  background-color: #fff;
  border: 1px solid #ccc;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 4px;
  width: 100%;
  position: relative;
}

.photo-block {
  max-width: 100%;
  height: auto;
}

.add-block-buttons {
  display: flex;
  gap: 10px;
}

.add-block-button {
  background-color: #333;
  color: #fff;
  padding: 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-button {
  text-align: center;
}

.save-button button {
  background-color: #333;
  color: #fff;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.delete-block-button {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: #ccc;
  color: #333;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.delete-block-button::before {
  content: '✖';
  font-size: 16px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.add-inline-buttons {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  display: flex;
  gap: 10px;
  z-index: 10;
}

.add-inline-buttons .add-block-button {
  background-color: #007bff;
  color: #fff;
  padding: 5px;
  font-size: 12px;
}
</style>