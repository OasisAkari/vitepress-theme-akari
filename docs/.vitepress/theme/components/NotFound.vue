<script setup lang="ts">
import { translations } from '../translations';

const faces = ["\\(^\u0414^)/", "(\u0387.\u0387)", "(\u02da\u0394\u02da)b", "(\u0387_\u0387)", "(^_^)b", "(>_<)", "(o^^)o", "(;-;)", "(\u2265o\u2264)", "\\(o_o)/", "(^-^*)", "(='X'=)"]



</script>

<template>
    <div class="page-not-found-container">
        <div class="page-not-found mdui-prose">
            <div class="page-not-found-avatar">
                {{ faces[Math.floor(Math.random() * faces.length)] }}
            </div>
            <div class="page-not-found-content">
                <div class="page-not-found-content-heading">404</div>
                <p>{{ translations.components.notFound }}</p>
            </div>
        </div>
    </div>
</template>

<style>
.page-not-found-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: calc(100vh - 96px);

}

.page-not-found {
    background-color: rgb(var(--mdui-color-surface-container));
    width: 100%;
    margin-bottom: 100px;
    border-radius: var(--mdui-shape-corner-extra-large);
    box-shadow: var(--mdui-elevation-level4);
    display: flex;
    flex-grow: 1;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    padding-top: 100px;
    padding-bottom: 100px;
}

.page-not-found-content {
    display: flex;
    max-width: 300px;
    justify-content: center;
    align-items: center;
    flex-grow: 1;
    flex-wrap: wrap;
    flex-direction: column

}

.page-not-found-content-heading {
    font-size: 100px;
    line-height: 70px;
}

.page-not-found-avatar {
    font-size: 100px;
    margin-right: 20px;
}
</style>